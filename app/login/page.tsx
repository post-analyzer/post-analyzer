'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, LogIn, BarChart2 } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from 'framer-motion'
import { useSpring, animated } from '@react-spring/web'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [supabase, setSupabase] = useState<any>(null)


  useEffect(() => {
    setSupabase(createClientComponentClient({
      cookieOptions: {
        name: 'sb-ulxkxpwlmwknzbdjerix-auth-token',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 400,
      }
    }))
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_active, role')
        .eq('id', user?.id)
        .single()

      if (userError) throw userError

      if (!userData?.is_active) {
        await supabase.auth.signOut()
        setError('Ihr Konto wurde deaktiviert. Bitte kontaktieren Sie den Administrator für weitere Informationen.')
        throw new Error('Konto deaktiviert')
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          last_sign_in_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Fehler beim Aktualisieren des letzten Logins:', updateError)
      }

      toast({
        title: "Erfolgreich angemeldet",
        description: "Sie werden weitergeleitet...",
      })
      
      router.push('/home')
    } catch (error: any) {
      if (error.message === 'Konto deaktiviert') {
        // Der Fehler wird bereits über setError angezeigt
      } else if (error.message === 'Invalid login credentials') {
        setError('Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.');
      } else {
        setError(`Ein Fehler ist aufgetreten: ${error.message}`);
      }
    } finally {
      setLoading(false)
    }
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const springProps = useSpring({
    from: { transform: 'scale(0.9)' },
    to: { transform: 'scale(1)' },
    config: { tension: 300, friction: 10 },
  })

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-blue-400 to-indigo-600 dark:from-gray-900 dark:to-slate-900 overflow-hidden py-8">
      <div className="flex-grow flex flex-col items-center justify-center w-full">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Post Analyzer</h1>
          <p className="text-xl text-white">Analyze tool für calls und Auswertungen</p>
        </motion.div>
        <animated.div style={springProps}>
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Willkommen zurück
              </CardTitle>
              <CardDescription className="text-center">
                Melden Sie sich an, um auf Ihre Agentenauswertung zuzugreifen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@firma.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird eingeloggt...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Anmelden
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </animated.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8"
        >
          <BarChart2 className="text-white h-16 w-16" />
        </motion.div>
      </div>
      <footer className="w-full text-center text-white mt-8">
        <p>&copy; {new Date().getFullYear()} Embers Call Center und Marketing GmbH. Alle Rechte vorbehalten.</p>
      </footer>
    </div>
  )
}

