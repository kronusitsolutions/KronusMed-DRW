import { ImageResponse } from 'next/og'

export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #32CD32 0%, #228B22 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 'bold',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          K
        </div>
        
        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          KronusMed
        </div>
        
        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            opacity: 0.9,
            textAlign: 'center',
          }}
        >
          Sistema de Clínica Médica
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
