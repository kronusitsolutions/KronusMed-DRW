import crypto from 'crypto';

// Clave de encriptación desde variables de entorno
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'fallback-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

// Función para generar IV (Initialization Vector)
function generateIV(): Buffer {
  return crypto.randomBytes(16);
}

// Función para derivar clave desde la clave base
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

// Función para encriptar datos sensibles
export function encryptPHI(data: string): string {
  try {
    if (!data) return data;
    
    const salt = crypto.randomBytes(16);
    const key = deriveKey(ENCRYPTION_KEY, salt);
    const iv = generateIV();
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Retornar salt:iv:encrypted (todos se necesitan para desencriptar)
    return salt.toString('hex') + ':' + iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Error encriptando datos:', error);
    // En caso de error, retornar datos originales pero logear el error
    return data;
  }
}

// Función para desencriptar datos sensibles
export function decryptPHI(encryptedData: string): string {
  try {
    if (!encryptedData) return encryptedData;
    
    // Verificar si los datos están encriptados (formato: salt:iv:encrypted)
    if (!encryptedData.includes(':')) {
      // Si no está encriptado, retornar como está (para compatibilidad)
      return encryptedData;
    }
    
    const parts = encryptedData.split(':');
    if (parts.length === 2) {
      // Formato antiguo: iv:encrypted
      const [ivHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const key = deriveKey(ENCRYPTION_KEY, iv); // Usar IV como salt para compatibilidad
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } else if (parts.length === 3) {
      // Formato nuevo: salt:iv:encrypted
      const [saltHex, ivHex, encrypted] = parts;
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const key = deriveKey(ENCRYPTION_KEY, salt);
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
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
export function encryptObject<T extends Record<string, any>>(obj: T, sensitiveFields: string[]): T {
  const encrypted = { ...obj } as any;
  
  sensitiveFields.forEach(field => {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encryptPHI(encrypted[field]);
    }
  });
  
  return encrypted as T;
}

// Función para desencriptar objeto completo
export function decryptObject<T extends Record<string, any>>(obj: T, sensitiveFields: string[]): T {
  const decrypted = { ...obj } as any;
  
  sensitiveFields.forEach(field => {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      decrypted[field] = decryptPHI(decrypted[field]);
    }
  });
  
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
