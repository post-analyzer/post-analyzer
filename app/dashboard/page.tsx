'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, LogOut, UserMinus, UserPlus, Edit } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { NewUserModal } from './components/NewUserModal'
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface UserData {
  id: string
  email: string
  first_name: string
  last_name: string
  last_sign_in_at: string | null
  is_active: boolean
  role: string
}

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  const [allUsers, setAllUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const fetchUsers = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      if (user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (userError) {
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([
              { 
                id: user.id, 
                email: user.email,
                first_name: user.user_metadata.first_name,
                last_name: user.user_metadata.last_name,
                is_active: true,
                role: 'user'
              }
            ])
            .select()
            .single()

          if (createError) throw createError
          setCurrentUser(newUser)
        } else {
          setCurrentUser(userData)
        }

        if (userData?.role === 'admin') {
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .order('is_active', { ascending: false })
            .order('last_name', { ascending: true })
            .order('first_name', { ascending: true })
    
          if (usersError) throw usersError
          setAllUsers(users || [])
        }
      }
    } catch (error: any) {
      console.error('Fehler beim Laden der Daten:', error)
      toast({
        title: "Fehler beim Laden der Daten",
        description: error.message || "Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error: any) {
      console.error('Fehler beim Abmelden:', error)
      toast({
        title: "Fehler beim Abmelden",
        description: "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      })
    }
  }

  const isCurrentUser = (userId: string) => currentUser?.id === userId;

  const handleToggleUserStatus = async () => {
    if (!selectedUser) return

    try {
      if (isCurrentUser(selectedUser.id) && selectedUser.role === 'admin') {
        toast({
          title: "Aktion nicht erlaubt",
          description: "Sie können Ihren eigenen Admin-Account nicht deaktivieren.",
          variant: "destructive",
        })
        return
      }

      const newStatus = !selectedUser.is_active
      const { error } = await supabase
        .from('users')
        .update({ is_active: newStatus })
        .eq('id', selectedUser.id)

      if (error) throw error

      toast({
        title: newStatus ? "Benutzer aktiviert" : "Benutzer deaktiviert",
        description: `Benutzer ${selectedUser.email} wurde erfolgreich ${newStatus ? 'aktiviert' : 'deaktiviert'}.`,
      })

      setAllUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id ? { ...user, is_active: newStatus } : user
        )
      )
    } catch (error: any) {
      console.error('Fehler beim Ändern des Benutzerstatus:', error)
      toast({
        title: "Fehler beim Ändern des Benutzerstatus",
        description: error.message || "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setSelectedUser(null)
      setIsConfirmOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Agentenauswertung Dashboard</h1>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="gap-2 bg-white hover:bg-gray-100 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white"
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="bg-white/50 backdrop-blur-sm dark:bg-gray-800/50 shadow-xl border-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5" />
            <CardHeader className="pb-2 relative">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Aktuelle Benutzerinformationen
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    {currentUser?.first_name} {currentUser?.last_name}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white break-all">
                    {currentUser?.email || 'Nicht verfügbar'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rolle</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize flex items-center gap-2">
                    {currentUser?.role === 'admin' ? (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                        Administrator
                      </>
                    ) : (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                        Benutzer
                      </>
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Letzter Login</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentUser?.last_sign_in_at 
                      ? new Date(currentUser.last_sign_in_at).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Europe/Berlin'
                        })
                      : 'Noch nie'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {currentUser?.role === 'admin' && (
            <Card className="bg-white dark:bg-gray-800 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl text-gray-800 dark:text-white">Alle Benutzer</CardTitle>
                <NewUserModal onUserAdded={fetchUsers} />
              </CardHeader>
              <CardContent>
                {allUsers.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">Keine Benutzer gefunden</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[20%]">Name</TableHead>
                        <TableHead className="w-[25%]">Email</TableHead>
                        <TableHead className="w-[10%]">Status</TableHead>
                        <TableHead className="w-[10%]">Rolle</TableHead>
                        <TableHead className="w-[15%]">Letzter Login</TableHead>
                        <TableHead className="w-[20%] text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.first_name} {user.last_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge 
                              className={user.is_active 
                                ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
                                : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
                              }
                            >
                              {user.is_active ? "Aktiv" : "Inaktiv"}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{user.role}</TableCell>
                          <TableCell>
                            {user.last_sign_in_at
                              ? new Date(user.last_sign_in_at).toLocaleString('de-DE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  timeZone: 'Europe/Berlin'
                                })
                              : 'Noch nie'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2 flex-nowrap">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 whitespace-nowrap"
                                onClick={() => {
                                  toast({
                                    title: "Info",
                                    description: "Bearbeiten-Funktion kommt bald!",
                                  })
                                }}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Bearbeiten
                              </Button>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className={`whitespace-nowrap ${user.is_active 
                                          ? "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                                          : "bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
                                        }`}
                                        onClick={() => {
                                          setSelectedUser(user)
                                          setIsConfirmOpen(true)
                                        }}
                                        disabled={isCurrentUser(user.id) && user.role === 'admin'}
                                      >
                                        {user.is_active 
                                          ? <><UserMinus className="h-4 w-4 mr-1" />Deaktivieren</>
                                          : <><UserPlus className="h-4 w-4 mr-1" />Aktivieren</>
                                        }
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{isCurrentUser(user.id) && user.role === 'admin' 
                                        ? 'Sie können Ihren eigenen Admin-Account nicht deaktivieren' 
                                        : user.is_active ? 'Benutzer deaktivieren' : 'Benutzer aktivieren'}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Benutzer {selectedUser?.is_active ? 'deaktivieren' : 'aktivieren'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie den Benutzer {selectedUser?.first_name} {selectedUser?.last_name} ({selectedUser?.email}) {selectedUser?.is_active ? 'deaktivieren' : 'aktivieren'} möchten?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleToggleUserStatus}
              className={selectedUser?.is_active 
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
              }
            >
              {selectedUser?.is_active ? 'Deaktivieren' : 'Aktivieren'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

