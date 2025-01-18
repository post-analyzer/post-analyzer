'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function getAgents() {
  const supabase = createServerComponentClient({ cookies })
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching agents:', error)
    throw new Error('Failed to fetch agents')
  }

  return data
}

export async function addAgent(agent: { name: string; gruppe: string; status: 'aktiv' | 'off' }) {
  const supabase = createServerComponentClient({ cookies })
  const { data, error } = await supabase
    .from('agents')
    .insert([agent])
    .select()

  if (error) {
    console.error('Server-Action: Fehler beim Hinzufügen des Agenten:', error)
    throw new Error(`Fehler beim Hinzufügen des Agenten: ${error.message}`)
  }

  revalidatePath('/agentlist')
  return data[0]
}

export async function updateAgent(id: string, updates: Partial<{ name: string; gruppe: string; status: 'aktiv' | 'off' }>) {
  const supabase = createServerComponentClient({ cookies })
  const { data, error } = await supabase
    .from('agents')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating agent:', error)
    throw new Error(`Failed to update agent: ${error.message}`)
  }

  if (!data || data.length === 0) {
    throw new Error('Agent not found or not updated')
  }

  revalidatePath('/agentlist')
  return data[0]
}

export async function deleteAgent(id: string) {
  const supabase = createServerComponentClient({ cookies })
  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting agent:', error)
    throw new Error('Failed to delete agent')
  }

  revalidatePath('/agentlist')
}

export async function importAgents(
  agents: Array<{ name: string; gruppe: string; status: 'aktiv' | 'off' }>
) {
  const supabase = createServerComponentClient({ cookies })
  let importedCount = 0
  let updatedCount = 0
  let errorCount = 0

  for (const agent of agents) {
    try {
      console.log('Processing agent:', agent)

      // Überprüfen, ob der Agent bereits existiert
      const { data: existingAgent, error: checkError } = await supabase
        .from('agents')
        .select('id, name, gruppe, status')
        .eq('name', agent.name)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Fehler beim Überprüfen des Agenten:', checkError)
        errorCount++
        continue
      }

      if (existingAgent) {
        // Agent existiert bereits, aktualisieren wenn nötig
        if (existingAgent.gruppe !== agent.gruppe || existingAgent.status !== agent.status) {
          const { error: updateError } = await supabase
            .from('agents')
            .update({
              gruppe: agent.gruppe,
              status: agent.status,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingAgent.id)

          if (updateError) {
            console.error('Fehler beim Aktualisieren des Agenten:', updateError)
            errorCount++
          } else {
            updatedCount++
          }
        }
      } else {
        // Neuen Agenten einfügen
        const { error: insertError } = await supabase
          .from('agents')
          .insert([agent])

        if (insertError) {
          console.error('Fehler beim Einfügen des Agenten:', insertError)
          errorCount++
        } else {
          importedCount++
        }
      }
    } catch (error) {
      console.error('Unerwarteter Fehler beim Importieren des Agenten:', error)
      errorCount++
    }
  }

  revalidatePath('/agentlist')
  return { importedCount, updatedCount, errorCount }
}

export async function deleteAllAgents() {
  const supabase = createServerComponentClient({ cookies })
  const { error } = await supabase
    .from('agents')
    .delete()
    .not('id', 'is', null)

  if (error) {
    console.error('Error deleting all agents:', error)
    throw new Error(`Failed to delete all agents: ${error.message}`)
  }

  revalidatePath('/agentlist')
  return { success: true, message: 'Alle Agenten wurden erfolgreich gelöscht.' }
}

