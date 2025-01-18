import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { parse } from 'csv-parse/sync'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const supabase = createServerComponentClient({ cookies })

    if (!file) {
      return NextResponse.json(
        { error: 'Keine Datei gefunden' },
        { status: 400 }
      )
    }

    const fileContent = await file.text()
    
    // Parse CSV with relaxed options
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      delimiter: ',',
    })

    for (const record of records) {
      // Check if record already exists
      const { data: existingData, error: checkError } = await supabase
        .from('call_statistics')
        .select('id')
        .eq('team_name', record.team_name)
        .eq('last_name', record.last_name)
        .eq('first_name', record.first_name)
        .eq('DateColumn', record.DateColumn)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing record:', checkError)
        continue
      }

      if (!existingData) {
        const { error: insertError } = await supabase
          .from('call_statistics')
          .insert([
            {
              team_name: record.team_name,
              last_name: record.last_name,
              first_name: record.first_name,
              DateColumn: record.DateColumn,
              not_ready_reason: record.not_ready_reason || '',
              not_ready_time: parseInt(record.not_ready_time) || 0,
              total_ready_time: parseInt(record.total_ready_time) || 0,
              total_ringing_time_in: parseInt(record.total_ringing_time_in) || 0,
              total_ringing_time_out: parseInt(record.total_ringing_time_out) || 0,
              total_login_time: parseInt(record.total_login_time) || 0,
              total_acw_time_in: parseInt(record.total_acw_time_in) || 0,
              total_acw_time_out: parseInt(record.total_acw_time_out) || 0,
              total_hold_time_in: parseInt(record.total_hold_time_in) || 0,
              total_hold_time_out: parseInt(record.total_hold_time_out) || 0,
              total_talk_time_in: parseInt(record.total_talk_time_in) || 0,
              total_talk_time_out: parseInt(record.total_talk_time_out) || 0,
              num_calls_answered: parseInt(record.num_calls_answered) || 0,
              num_calls_answered_ot: parseInt(record.num_calls_answered_ot) || 0,
              num_calls_out: parseInt(record.num_calls_out) || 0,
              num_calls_rejected: parseInt(record.num_calls_rejected) || 0,
              service_name: record.service_name || '',
              TimeGroupColumn30: record.TimeGroupColumn30 || ''
            }
          ])

        if (insertError) {
          console.error('Error inserting record:', insertError)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Importieren' },
      { status: 500 }
    )
  }
}

