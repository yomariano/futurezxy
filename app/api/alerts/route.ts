import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const { phone_number, alert_types, enabled } = body

    const { data: user, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    const { data, error } = await supabase
      .from('user_alerts')
      .upsert({
        user_id: user.user.id,
        phone_number,
        alert_types,
        enabled
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error updating alert settings' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const supabase = createClient()
  
  try {
    const { data: user, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    const { data, error } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('user_id', user.user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows returned"

    return NextResponse.json(data || {})
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error fetching alert settings' },
      { status: 500 }
    )
  }
} 