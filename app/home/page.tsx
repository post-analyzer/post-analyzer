'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, LogOut, Users, BarChart2, LayoutDashboard } from 'lucide-react'
import Image from 'next/image'

interface UserData {
  first_name: string
  last_name: string
  email: string
  role: string
}

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data, error } = await supabase
          .from('users')
          .select('first_name, last_name, email, role')
          .eq('id', authUser.id)
          .single()

        if (error) {
          console.error('Error fetching user data:', error)
        } else {
          setUser(data)
        }
      } else {
        router.push('/login')
      }
      setLoading(false)
    }

    fetchUser()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-2xl font-semibold text-blue-800">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-[1400px] mx-auto p-8 space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-center gap-8 bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative w-48 h-48">
              <Image
                src="/logo.png"
                alt="Company Logo"
                layout="fill"
                objectFit="contain"
                className="rounded-xl"
              />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold text-blue-900 mb-3">Willkommen, {user?.first_name}!</h1>
              <p className="text-xl text-blue-700">Wählen Sie einen Bereich aus, um fortzufahren</p>
            </div>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            size="lg"
            className="gap-2 bg-white hover:bg-blue-50 text-blue-700 border-blue-300 transition-colors text-lg"
          >
            <LogOut className="h-5 w-5" />
            Abmelden
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Dashboard', icon: LayoutDashboard, color: 'blue', path: '/dashboard' },
            { title: 'Agenten verwalten', icon: Users, color: 'green', path: '/agent-list' },
            { title: 'Anrufstatistik', icon: BarChart2, color: 'red', path: '/call-statistics' }
          ].map((item, index) => (
            <Card key={index} className="bg-white shadow-xl hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800 flex items-center gap-3">
                  <item.icon className={`h-8 w-8 text-${item.color}-600`} />
                  {item.title}
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  {item.title === 'Dashboard' && 'Übersicht und Statistiken'}
                  {item.title === 'Agenten verwalten' && 'Agentenliste und Verwaltung'}
                  {item.title === 'Anrufstatistik' && 'Detaillierte Auswertungen'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className={`w-full bg-${item.color}-600 hover:bg-${item.color}-700 transition-colors text-lg py-6`}
                  onClick={() => handleNavigation(item.path)}
                >
                  Öffnen
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

