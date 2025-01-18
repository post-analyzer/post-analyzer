'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function createUser({ email, password, firstName, lastName }: { email: string; password: string; firstName: string; lastName: string }) {
  const supabase = createServerComponentClient({ cookies })

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    })

    if (authError) throw authError

    const { error: profileError } = await supabase
      .from('users')
      .insert([
        { 
          id: authData.user?.id,
          email,
          first_name: firstName,
          last_name: lastName,
          is_active: true,
          role: 'user'
        }
      ])

    if (profileError) throw profileError

    return { success: true }
  } catch (error: any) {
    console.error('Error creating user:', error)
    return { success: false, error: error.message }
  }
}

