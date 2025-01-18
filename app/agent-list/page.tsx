'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Search, Users, FileSpreadsheet, AlertCircle, Edit, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { getAgents, addAgent, updateAgent, deleteAgent, deleteAllAgents } from './actions'
import { EditAgentModal } from './components/EditAgentModal'
import { ImportTab } from './components/ImportTab'
import { Home, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx';

interface Agent {
  id: string
  name: string
  gruppe: string
  status: 'aktiv' | 'off'
  updated_at: string | null;
  lastModified: string
}

export default function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedGruppe, setSelectedGruppe] = useState<string>('all')
  const [newAgent, setNewAgent] = useState<Partial<Agent>>({
    name: '',
    gruppe: 'DE',
    status: 'aktiv'
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null)
  const [activeTab, setActiveTab] = useState('list')
  const [isLoading, setIsLoading] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [agentToEdit, setAgentToEdit] = useState<Agent | null>(null)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    setIsLoading(true)
    try {
      const fetchedAgents = await getAgents()
      setAgents(fetchedAgents)
    } catch (error) {
      toast.error('Fehler beim Laden der Agentenliste')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAgent = async () => {
    if (!newAgent.name?.trim()) {
      toast.error('Bitte geben Sie einen Namen ein')
      return
    }

    try {
      console.log('Versuche, neuen Agenten hinzuzufügen:', newAgent)
      const addedAgent = await addAgent(newAgent as { name: string; gruppe: string; status: 'aktiv' | 'off' })
      console.log('Agent erfolgreich hinzugefügt:', addedAgent)
      toast.success('Agent erfolgreich hinzugefügt')
      setNewAgent({ name: '', gruppe: 'DE', status: 'aktiv' })
      fetchAgents()
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Agenten:', error)
      toast.error(`Fehler beim Hinzufügen des Agenten: ${error.message || 'Unbekannter Fehler'}`)
    }
  }

  const confirmDelete = (agent: Agent) => {
    setAgentToDelete(agent)
    setDeleteDialogOpen(true)
  }

  const handleDeleteAgent = async () => {
    if (!agentToDelete) return

    try {
      await deleteAgent(agentToDelete.id)
      toast.success('Agent erfolgreich gelöscht')
      setDeleteDialogOpen(false)
      setAgentToDelete(null)
      fetchAgents()
    } catch (error) {
      toast.error('Fehler beim Löschen des Agenten')
    }
  }

  const openEditModal = (agent: Agent) => {
    setAgentToEdit(agent)
    setEditModalOpen(true)
  }

  const handleAgentUpdated = () => {
    fetchAgents()
    setEditModalOpen(false)
  }

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || agent.status === selectedStatus
    const matchesGruppe = selectedGruppe === 'all' || agent.gruppe === selectedGruppe
    return matchesSearch && matchesStatus && matchesGruppe
  })

  const uniqueGruppen = Array.from(new Set(agents.map(agent => agent.gruppe)))
  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'aktiv').length,
    inactive: agents.filter(a => a.status === 'off').length
  }

  const handleDeleteAll = async () => {
    try {
      const result = await deleteAllAgents()
      if (result.success) {
        toast.success(result.message)
        fetchAgents() // Refresh the agent list after deletion
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast.error('Fehler beim Löschen aller Agenten: ' + error.message)
    }
  }

  const exportToExcel = () => {
  // Create a new workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(agents.map(agent => ({
    Name: agent.name,
    Gruppe: agent.gruppe,
    Status: agent.status,
    'Zuletzt geändert': agent.updated_at ? new Date(agent.updated_at).toLocaleString('de-DE') : 'Keine Angabe'
  })));

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Agenten');

  // Generate Excel file and trigger download
  XLSX.writeFile(wb, 'Agentenliste.xlsx');

  toast.success('Excel-Datei wurde erfolgreich exportiert');
}


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600"></div>
          <p className="mt-4 text-xl font-semibold text-blue-800">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 w-full space-y-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Agentenverwaltung</h1>
          <p className="text-lg text-blue-700">Verwalten Sie Ihre Agentenliste</p>
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        <Button asChild variant="outline" className="bg-white hover:bg-blue-100 text-blue-900 border-blue-300 transition-colors">
          <Link href="/home">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Link>
        </Button>
        <Button asChild variant="outline" className="bg-white hover:bg-blue-100 text-blue-900 border-blue-300 transition-colors">
          <Link href="/call-statistics">
            <BarChart2 className="mr-2 h-4 w-4" />
            Anrufstatistik
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white shadow-md rounded-lg p-1 border border-blue-200">
          <TabsTrigger value="list" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Users className="mr-2 h-4 w-4" />
            Agentenliste
          </TabsTrigger>
          <TabsTrigger value="import" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-t-4 border-t-blue-500">
              <CardHeader className="border-b border-blue-100">
                <CardTitle className="text-blue-800">Gesamt</CardTitle>
                <CardDescription className="text-blue-600">Alle Agenten</CardDescription>
              </CardHeader>
              <CardContent className="bg-white">
                <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-t-4 border-t-blue-500">
              <CardHeader className="border-b border-blue-100">
                <CardTitle className="text-blue-800">Aktiv</CardTitle>
                <CardDescription className="text-blue-600">Aktive Agenten</CardDescription>
              </CardHeader>
              <CardContent className="bg-white">
                <div className="text-3xl font-bold text-green-600">{stats.active}</div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-t-4 border-t-blue-500">
              <CardHeader className="border-b border-blue-100">
                <CardTitle className="text-blue-800">Inaktiv</CardTitle>
                <CardDescription className="text-blue-600">Inaktive Agenten</CardDescription>
              </CardHeader>
              <CardContent className="bg-white">
                <div className="text-3xl font-bold text-gray-600">{stats.inactive}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-t-4 border-t-blue-500">
            <CardHeader className="border-b border-blue-100">
              <CardTitle className="text-blue-900">Neuen Agenten hinzufügen</CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="agentName" className="text-blue-900">Agent Name</Label>
                  <Input
                    id="agentName"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    placeholder="Name eingeben"
                    className="mt-1 w-full bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900 placeholder-blue-400"
                  />
                </div>
                <div className="w-[150px]">
                  <Label htmlFor="gruppe" className="text-blue-900">Gruppe</Label>
                  <Select
                    value={newAgent.gruppe}
                    onValueChange={(value) => setNewAgent({ ...newAgent, gruppe: value })}
                    className="w-full focus:border-blue-500 focus:ring-blue-500"
                  >
                    <SelectTrigger className="w-full bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900">
                      <SelectValue placeholder="Gruppe wählen" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-blue-300">
                      {uniqueGruppen.map(gruppe => (
                        <SelectItem key={gruppe} value={gruppe} className="text-blue-900">{gruppe}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[150px]">
                  <Label htmlFor="status" className="text-blue-900">Status</Label>
                  <Select
                    value={newAgent.status}
                    onValueChange={(value: 'aktiv' | 'off') => setNewAgent({ ...newAgent, status: value })}
                    className="w-full focus:border-blue-500 focus:ring-blue-500"
                  >
                    <SelectTrigger className="w-full bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900">
                      <SelectValue placeholder="Status wählen" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-blue-300">
                      <SelectItem value="aktiv" className="text-blue-900">Aktiv</SelectItem>
                      <SelectItem value="off" className="text-blue-900">Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddAgent} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Hinzufügen
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-t-4 border-t-blue-500">
            <CardHeader className="border-b border-blue-100">
              <CardTitle className="text-blue-900">Agentenliste</CardTitle>
              <CardDescription className="text-blue-700">
                {filteredAgents.length} von {agents.length} Agenten angezeigt
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="space-y-4">
                <div className="flex gap-6 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Nach Namen suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900 placeholder-blue-400"
                    />
                  </div>
                  <div className="w-[200px]">
                    <Select value={selectedGruppe} onValueChange={setSelectedGruppe}>
                      <SelectTrigger className="w-full bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900">
                        <SelectValue placeholder="Alle Gruppen" />
                      </SelectTrigger>
                      <SelectContent side="bottom" className="bg-white border-blue-300">
                        <SelectItem value="all" className="text-blue-900">Alle Gruppen</SelectItem>
                        {uniqueGruppen.map(gruppe => (
                          <SelectItem key={gruppe} value={gruppe} className="text-blue-900">{gruppe}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-[200px]">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-full bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900">
                        <SelectValue placeholder="Alle Status" />
                      </SelectTrigger>
                      <SelectContent side="bottom" className="bg-white border-blue-300">
                        <SelectItem value="all" className="text-blue-900">Alle Status</SelectItem>
                        <SelectItem value="aktiv" className="text-blue-900">Aktiv</SelectItem>
                        <SelectItem value="off" className="text-blue-900">Inaktiv</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div className="flex space-x-2">
                    <Button 
                      onClick={exportToExcel}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Excel Export
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Alle Agenten löschen
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Diese Aktion kann nicht rückgängig gemacht werden. Alle Agenten werden dauerhaft aus der Datenbank gelöscht.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAll}>Löschen</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <div>{/* Platzhalter für zukünftige Elemente */}</div>
                </div>

                <div className="rounded-lg border border-blue-200 overflow-hidden">
                  <div className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-blue-50">
                          <TableHead className="w-[25%] text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50">Agent Name</TableHead>
                          <TableHead className="w-[20%] text-center text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50">Gruppe</TableHead>
                          <TableHead className="w-[15%] text-center text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50">Status</TableHead>
                          <TableHead className="w-[25%] text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50">Zuletzt geändert</TableHead>
                          <TableHead className="w-[15%] text-right text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50">Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                    </Table>
                  </div>
                  <ScrollArea className="h-[600px] w-full">
                    <Table>
                      <TableBody className="w-full">
                        {filteredAgents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center">
                              <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
                              <p className="text-blue-900">Keine Agenten gefunden</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAgents.map((agent) => (
                            <TableRow key={agent.id} className="hover:bg-blue-50 transition-colors">
                              <TableCell className="w-[25%] text-left text-blue-900 font-medium">{agent.name}</TableCell>
                              <TableCell className="w-[20%] text-center text-blue-900">{agent.gruppe}</TableCell>
                              <TableCell className="w-[15%] text-center">
                                <Badge 
                                  variant={agent.status === 'aktiv' ? 'success' : 'destructive'}
                                  className={`
                                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    ${agent.status === 'aktiv' 
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                                    }
                                  `}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                    agent.status === 'aktiv' ? 'bg-green-500' : 'bg-red-500'
                                  }`} />
                                  {agent.status === 'aktiv' ? 'Aktiv' : 'Inaktiv'}
                                </Badge>
                              </TableCell>
                              <TableCell className="w-[25%] text-left text-blue-900">{agent.updated_at ? new Date(agent.updated_at).toLocaleString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Keine Angabe'}</TableCell>
                              <TableCell className="w-[15%] text-right space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditModal(agent)}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => confirmDelete(agent)}
                                  className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <ImportTab onImportComplete={fetchAgents} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Agent löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Agenten "{agentToDelete?.name}" wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAgent}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <EditAgentModal
        agent={agentToEdit}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onAgentUpdated={handleAgentUpdated}
        uniqueGruppen={uniqueGruppen}
      />
    </div>
  )
}

