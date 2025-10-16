import { NextResponse } from "next/server"

export async function GET() {
  try {
    return NextResponse.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown'
    })
  } catch (error) {
    console.error('Liveness check error:', error)
    return NextResponse.json(
      { 
        status: "error", 
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


