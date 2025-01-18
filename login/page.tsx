'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Login timeout after 10 seconds
    const loginTimeout = setTimeout(() => {
      setLoading(false)
      setError('Anmeldevorgang dauert zu lange. Bitte versuchen Sie es erneut.')
    }, 10000)

    try {
      // Basic validation
      if (!email || !password) {
        clearTimeout(loginTimeout)
        setError('Bitte füllen Sie alle Felder aus.')
        setLoading(false)
        return
      }

      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      clearTimeout(loginTimeout)

      if (signInError) {
        throw signInError
      }

      if (!user) {
        throw new Error('Keine Benutzerinformationen erhalten')
      }

      // Simplified user check
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_active')
        .eq('id', user.id)
        .single()

      if (userError) {
        throw userError
      }

      if (!userData?.is_active) {
        await supabase.auth.signOut()
        throw new Error('Konto deaktiviert')
      }

      // Success - redirect immediately
      router.push('/home')
      
    } catch (error: any) {
      clearTimeout(loginTimeout)
      console.error('Login error:', error)
      
      if (error.message === 'Konto deaktiviert') {
        setError('Ihr Konto wurde deaktiviert. Bitte kontaktieren Sie den Administrator.')
      } else if (error.message === 'Invalid login credentials') {
        setError('Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.')
      } else if (error.message.includes('rate limit')) {
        setError('Zu viele Anmeldeversuche. Bitte warten Sie einen Moment.')
      } else if (error.message === 'Keine Benutzerinformationen erhalten') {
        setError('Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.')
      } else {
        setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
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

