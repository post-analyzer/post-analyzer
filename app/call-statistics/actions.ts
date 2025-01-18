'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import * as XLSX from 'xlsx'

export interface CallStatistic {
  id: string
  team_name: string
  last_name: string
  first_name: string
  datecolumn: string
  not_ready_reason: string
  not_ready_time: number
  total_ready_time: number
  total_ringing_time_in: number
  total_ringing_time_out: number
  total_login_time: number
  total_acw_time_in: number
  total_acw_time_out: number
  total_hold_time_in: number
  total_hold_time_out: number
  total_talk_time_in: number
  total_talk_time_out: number
  num_calls_answered: number
  num_calls_answered_ot: number
  num_calls_out: number
  num_calls_rejected: number
  service_name: string
  timegroupcolumn30: string
}

function formatTimeGroup(value: any): string {
  if (!value) return ''
  
  // Wenn es eine Nummer ist, geben wir die Sekunden zurück
  if (typeof value === 'number') {
    return Math.round(value * 86400).toString() // Konvertiert Excel-Zeit direkt in Sekunden (24*60*60)
  }
  
  // Wenn es bereits ein String ist, geben wir ihn unverändert zurück
  return String(value)
}

export async function importCallStatistics(formData: FormData) {
  console.log('Import wird gestartet')
  const supabase = createServerComponentClient({ cookies })
  const file = formData.get('file') as File
  
  if (!file) {
    console.error('Keine Datei gefunden')
    return { success: false, error: 'Keine Datei gefunden' }
  }

  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(firstSheet)
    
    console.log('Erste Zeile der Daten:', jsonData[0])

    let importedCount = 0
    let skippedCount = 0

    for (const row of jsonData) {
      // Datum konvertieren
      let formattedDate = ''
      if (row['DateColumn']) {
        try {
          const excelDate = XLSX.SSF.parse_date_code(row['DateColumn'])
          formattedDate = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`
        } catch (error) {
          console.error('Fehler beim Konvertieren des Datums:', error)
          formattedDate = new Date().toISOString().split('T')[0]
        }
      }

      const record = {
        team_name: String(row['team_name'] || ''),
        last_name: String(row['last_name'] || ''),
        first_name: String(row['first_name'] || ''),
        datecolumn: formattedDate,
        not_ready_reason: String(row['not_ready_reason'] || ''),
        not_ready_time: Number(row['not_ready_time'] || 0),
        total_ready_time: Number(row['total_ready_time'] || 0),
        total_ringing_time_in: Number(row['total_ringing_time_in'] || 0),
        total_ringing_time_out: Number(row['total_ringing_time_out'] || 0),
        total_login_time: Number(row['total_login_time'] || 0),
        total_acw_time_in: Number(row['total_acw_time_in'] || 0),
        total_acw_time_out: Number(row['total_acw_time_out'] || 0),
        total_hold_time_in: Number(row['total_hold_time_in'] || 0),
        total_hold_time_out: Number(row['total_hold_time_out'] || 0),
        total_talk_time_in: Number(row['total_talk_time_in'] || 0),
        total_talk_time_out: Number(row['total_talk_time_out'] || 0),
        num_calls_answered: Number(row['num_calls_answered'] || 0),
        num_calls_answered_ot: Number(row['num_calls_answered_ot'] || 0),
        num_calls_out: Number(row['num_calls_out'] || 0),
        num_calls_rejected: Number(row['num_calls_rejected'] || 0),
        service_name: String(row['service_name'] || ''),
        timegroupcolumn30: formatTimeGroup(row['TimeGroupColumn30'])
      }

      // Prüfen ob die Pflichtfelder vorhanden sind
      if (!record.team_name || !record.last_name || !record.first_name) {
        console.log('Überspringe ungültigen Datensatz:', record)
        skippedCount++
        continue
      }

      console.log('Verarbeite Datensatz:', {
        team_name: record.team_name,
        last_name: record.last_name,
        first_name: record.first_name,
        datecolumn: record.datecolumn,
        timegroupcolumn30: record.timegroupcolumn30,
        not_ready_time: record.not_ready_time,
        total_ready_time: record.total_ready_time
      })

      const { error: insertError } = await supabase
        .from('call_statistics')
        .insert([record])

      if (insertError) {
        console.error('Fehler beim Einfügen:', insertError)
        skippedCount++
      } else {
        importedCount++
        console.log('Datensatz erfolgreich eingefügt')
      }
    }

    return { 
      success: true, 
      message: `${importedCount} Datensätze erfolgreich importiert. ${skippedCount} Datensätze wurden übersprungen.`,
      importedCount
    }
  } catch (error) {
    console.error('Importfehler:', error)
    return { success: false, error: `Fehler beim Importieren: ${error.message}` }
  }
}

export async function getCallStatistics(): Promise<CallStatistic[]> {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase
    .from('call_statistics')
    .select('*')

  if (error) {
    console.error('Fehler beim Laden der Statistiken:', error)
    throw new Error('Fehler beim Laden der Statistiken')
  }

  return data as CallStatistic[]
}

export async function deleteCallStatistics() {
  const supabase = createServerComponentClient({ cookies })
  
  const { error } = await supabase
    .from('call_statistics')
    .delete()
    .not('id', 'is', null)

  if (error) {
    console.error('Fehler beim Löschen der Statistiken:', error)
    throw new Error(`Fehler beim Löschen der Statistiken: ${error.message}`)
  }

  return { success: true, message: 'Alle Anrufstatistiken wurden erfolgreich gelöscht.' }
}

