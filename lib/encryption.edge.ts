// Versión de encriptación compatible con Edge Runtime
// Usa Web Crypto API en lugar del módulo crypto de Node.js

// Clave de encriptación desde variables de entorno
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'fallback-key-change-in-production';
const ALGORITHM = 'AES-CBC';

// Función para generar IV (Initialization Vector)
async function generateIV(): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(16));
}

// Función para derivar clave desde la clave base usando PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-CBC', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Función para encriptar datos sensibles
export async function encryptPHI(data: string): Promise<string> {
  try {
    if (!data) return data;
    
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(ENCRYPTION_KEY, salt);
    const iv = await generateIV();
    
    const encrypted = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv: new Uint8Array(iv) },
      key,
      new TextEncoder().encode(data)
    );
    
    // Convertir a hex
    const encryptedArray = new Uint8Array(encrypted);
    const encryptedHex = Array.from(encryptedArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Retornar salt:iv:encrypted (todos se necesitan para desencriptar)
    const saltHex = Array.from(salt)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const ivHex = Array.from(iv)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return saltHex + ':' + ivHex + ':' + encryptedHex;
  } catch (error) {
    console.error('Error encriptando datos:', error);
    // En caso de error, retornar datos originales pero logear el error
    return data;
  }
}

// Función para desencriptar datos sensibles
export async function decryptPHI(encryptedData: string): Promise<string> {
  try {
    if (!encryptedData) return encryptedData;
    
    // Verificar si los datos están encriptados (formato: salt:iv:encrypted)
    if (!encryptedData.includes(':')) {
      // Si no está encriptado, retornar como está (para compatibilidad)
      return encryptedData;
    }
    
    const parts = encryptedData.split(':');
    if (parts.length === 2) {
      // Formato antiguo: iv:encrypted (compatibilidad con versión anterior)
      const [ivHex, encrypted] = parts;
      const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
      const key = await deriveKey(ENCRYPTION_KEY, iv); // Usar IV como salt para compatibilidad
      
      const encryptedArray = new Uint8Array(encrypted.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
      const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv: iv },
        key,
        encryptedArray
      );
      
      return new TextDecoder().decode(decrypted);
    } else if (parts.length === 3) {
      // Formato nuevo: salt:iv:encrypted
      const [saltHex, ivHex, encrypted] = parts;
      const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
      const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
      const key = await deriveKey(ENCRYPTION_KEY, salt);
      
      const encryptedArray = new Uint8Array(encrypted.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
      const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv: iv },
        key,
        encryptedArray
      );
      
      return new TextDecoder().decode(decrypted);
    }
    
    return encryptedData;
  } catch (error) {
    console.error('Error desencriptando datos:', error);
    // TEMPORAL: Si hay error de desencriptación, retornar un placeholder
    // Esto evita mostrar datos encriptados en la UI
    if (encryptedData.includes(':')) {
      return '[Número no disponible]';
    }
    return encryptedData;
  }
}

// Función para encriptar objeto completo
export async function encryptObject<T extends Record<string, any>>(obj: T, sensitiveFields: string[]): Promise<T> {
  const encrypted = { ...obj } as any;
  
  for (const field of sensitiveFields) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = await encryptPHI(encrypted[field]);
    }
  }
  
  return encrypted as T;
}

// Función para desencriptar objeto completo
export async function decryptObject<T extends Record<string, any>>(obj: T, sensitiveFields: string[]): Promise<T> {
  const decrypted = { ...obj } as any;
  
  for (const field of sensitiveFields) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      decrypted[field] = await decryptPHI(decrypted[field]);
    }
  }
  
  return decrypted as T;
}

// Función para verificar si los datos están encriptados
export function isEncrypted(data: string): boolean {
  if (!data || !data.includes(':')) return false;
  
  const parts = data.split(':');
  // Formato antiguo: iv:encrypted (2 partes, primera de 32 caracteres)
  // Formato nuevo: salt:iv:encrypted (3 partes, primera de 32 caracteres)
  return (parts.length === 2 && parts[0].length === 32) || 
         (parts.length === 3 && parts[0].length === 32 && parts[1].length === 32);
}

// Función para sanitizar datos sensibles en logs
export function sanitizeForLogs(data: any, sensitiveFields: string[]): any {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      if (typeof sanitized[field] === 'string') {
        sanitized[field] = '[REDACTED]';
      } else if (Array.isArray(sanitized[field])) {
        sanitized[field] = '[ARRAY_REDACTED]';
      } else if (typeof sanitized[field] === 'object') {
        sanitized[field] = '[OBJECT_REDACTED]';
      }
    }
  });
  
  return sanitized;
}
