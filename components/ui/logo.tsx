import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
  logoPath?: string
}

export function Logo({ 
  size = 'md', 
  className = '', 
  showText = true, 
  logoPath = '/logo.png' 
}: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Image */}
      <div className={`${sizeClasses[size]} bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden`}>
        <img
          src={logoPath}
          alt="KronusMed Logo"
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Text */}
      {showText && (
        <span className={`font-semibold text-gray-900 ${textSizes[size]} leading-tight`}>
          KronusMed
        </span>
      )}
    </div>
  )
}
