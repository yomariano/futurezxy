import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    // Here you would typically make a call to your AI service
    // For now, we'll just echo back a simple response
    const response = {
      message: `I received your message: "${message}". This is a placeholder response.`
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
} 