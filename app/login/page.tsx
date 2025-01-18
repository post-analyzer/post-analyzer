'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, LogIn } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { checkRateLimit, getRemainingTime } from '@/utils/rateLimit'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [remainingTime, setRemainingTime] = useState(0)
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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRateLimited) {
      timer = setInterval(() => {
        const remaining = getRemainingTime();
        if (remaining <= 0) {
          setIsRateLimited(false);
          clearInterval(timer);
        } else {
          setRemainingTime(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRateLimited]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkRateLimit()) {
      setIsRateLimited(true);
      setRemainingTime(getRemainingTime());
      return;
    }
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
      } else if (error.message === 'Request rate limit reached') {
        setIsRateLimited(true);
        setRemainingTime(getRemainingTime());
        setError('Sie haben das Anfragelimit erreicht. Bitte warten Sie eine Minute, bevor Sie es erneut versuchen.');
      } else {
        setError(`Ein Fehler ist aufgetreten: ${error.message}`);
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-slate-900">
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
          {isRateLimited && (
            <Alert variant="warning" className="mb-4">
              <AlertDescription>
                Bitte warten Sie {Math.ceil(remainingTime / 1000)} Sekunden, bevor Sie es erneut versuchen.
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
                disabled={loading || isRateLimited}
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
                disabled={loading || isRateLimited}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || isRateLimited}
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
    </div>
  )
}

