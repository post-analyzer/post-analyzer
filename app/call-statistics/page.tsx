'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Users, FileSpreadsheet, AlertCircle, Home, BarChart2, FileDown, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { getCallStatistics, CallStatistic, deleteCallStatistics } from './actions'
import { ImportTab } from './components/ImportTab'
import { Checkbox } from "@/components/ui/checkbox"
import * as XLSX from 'xlsx'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

const CallStatistics: React.FC = () => {
  const [statistics, setStatistics] = useState<CallStatistic[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('list')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedColumns, setSelectedColumns] = useState({
    inboundCalls: true,
    inboundTalkTime: true,
    inboundHoldTime: true,
    inboundACW: true,
    inboundTotal: true,
    inboundAHT: true,
    outboundCalls: true,
    outboundTalkTime: true,
    outboundHoldTime: true,
    outboundACW: true,
    outboundTotal: true,
    outboundAHT: true,
    notReadyReason: true,
    notReadyTime: true,
    totalReadyTime: true,
    totalRingingTimeIn: true,
    totalRingingTimeOut: true,
    totalLoginTime: true,
    callsAnsweredOT: true,
    callsRejected: true,
    serviceName: true,
    timeGroup: true,
  })
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [selectedView, setSelectedView] = useState<'agent' | 'team'>('agent')

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    setIsLoading(true)
    try {
      const fetchedStats = await getCallStatistics()
      setStatistics(fetchedStats)
    } catch (error) {
      toast.error('Fehler beim Laden der Anrufstatistiken')
    } finally {
      setIsLoading(false)
    }
  }

  const exportToExcel = () => {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet([])

    // Add header row
    const header = ['Team', 'Nachname', 'Vorname', 'Datum']
    if (selectedColumns.inboundCalls) header.push('Inbound Anrufe')
    if (selectedColumns.inboundTalkTime) header.push('Inbound Gesprächszeit')
    if (selectedColumns.inboundHoldTime) header.push('Inbound Haltezeit')
    if (selectedColumns.inboundACW) header.push('Inbound ACW')
    if (selectedColumns.inboundAHT) header.push('Inbound AHT')
    if (selectedColumns.outboundCalls) header.push('Outbound Anrufe')
    if (selectedColumns.outboundTalkTime) header.push('Outbound Gesprächszeit')
    if (selectedColumns.outboundHoldTime) header.push('Outbound Haltezeit')
    if (selectedColumns.outboundACW) header.push('Outbound ACW')
    if (selectedColumns.outboundAHT) header.push('Outbound AHT')
    if (selectedColumns.notReadyReason) header.push('Not Ready Grund')
    if (selectedColumns.notReadyTime) header.push('Not Ready Zeit')
    if (selectedColumns.totalReadyTime) header.push('Gesamte Bereitzeit')
    if (selectedColumns.totalRingingTimeIn) header.push('Klingelzeit eingehend')
    if (selectedColumns.totalRingingTimeOut) header.push('Klingelzeit ausgehend')
    if (selectedColumns.totalLoginTime) header.push('Gesamte Anmeldezeit')
    if (selectedColumns.callsAnsweredOT) header.push('Anrufe beantwortet (Überlauf)')
    if (selectedColumns.callsRejected) header.push('Abgelehnte Anrufe')
    if (selectedColumns.serviceName) header.push('Service Name')
    if (selectedColumns.timeGroup) header.push('Zeitgruppe')

    XLSX.utils.sheet_add_aoa(ws, [header])

    // Add data rows
    filteredStatistics.forEach(stat => {
      const row = [stat.team_name, stat.last_name, stat.first_name, stat.datecolumn]
      if (selectedColumns.inboundCalls) row.push(stat.num_calls_answered)
      if (selectedColumns.inboundTalkTime) row.push(stat.total_talk_time_in)
      if (selectedColumns.inboundHoldTime) row.push(stat.total_hold_time_in)
      if (selectedColumns.inboundACW) row.push(stat.total_acw_time_in)
      if (selectedColumns.inboundAHT) row.push(stat.inbound_aht)
      if (selectedColumns.outboundCalls) row.push(stat.num_calls_out)
      if (selectedColumns.outboundTalkTime) row.push(stat.total_talk_time_out)
      if (selectedColumns.outboundHoldTime) row.push(stat.total_hold_time_out)
      if (selectedColumns.outboundACW) row.push(stat.total_acw_time_out)
      if (selectedColumns.outboundAHT) row.push(stat.outbound_aht)
      if (selectedColumns.notReadyReason) row.push(stat.not_ready_reason || '')
      if (selectedColumns.notReadyTime) row.push(stat.not_ready_time)
      if (selectedColumns.totalReadyTime) row.push(stat.total_ready_time)
      if (selectedColumns.totalRingingTimeIn) row.push(stat.total_ringing_time_in)
      if (selectedColumns.totalRingingTimeOut) row.push(stat.total_ringing_time_out)
      if (selectedColumns.totalLoginTime) row.push(stat.total_login_time)
      if (selectedColumns.callsAnsweredOT) row.push(stat.num_calls_answered_ot)
      if (selectedColumns.callsRejected) row.push(stat.num_calls_rejected)
      if (selectedColumns.serviceName) row.push(stat.service_name || '')
      if (selectedColumns.timeGroup) row.push(stat.timegroupcolumn30)
      XLSX.utils.sheet_add_aoa(ws, [row], { origin: -1 })
    })

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Anrufstatistiken')

    // Generate Excel file
    XLSX.writeFile(wb, `Anrufstatistiken_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const uniqueTeams = Array.from(new Set(statistics.map(stat => stat.team_name)))
  const uniqueDates = Array.from(new Set(statistics.map(stat => stat.datecolumn)))
  const uniqueAgents = Array.from(new Set(statistics.map(stat => `${stat.first_name} ${stat.last_name}`)))

  const filteredStatistics = statistics.filter(stat => {
    const matchesSearch = 
      stat.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stat.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stat.team_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTeam = selectedTeam === 'all' || stat.team_name === selectedTeam
    const matchesDate = selectedDate === 'all' || stat.datecolumn === selectedDate
    const matchesAgent = selectedAgent === 'all' || `${stat.first_name} ${stat.last_name}` === selectedAgent
    return matchesSearch && matchesTeam && matchesDate && (selectedView === 'team' ? matchesTeam : matchesAgent)
  })

  const calculateAHT = (aht: number) => {
    return aht.toFixed(2);
  }

  const calculateTeamStats = (teamName: string) => {
    const teamStats = filteredStatistics.filter(stat => stat.team_name === teamName);
    const inboundCalls = teamStats.reduce((sum, stat) => sum + stat.num_calls_answered, 0);
    const inboundTalkTime = teamStats.reduce((sum, stat) => sum + stat.total_talk_time_in, 0);
    const inboundHoldTime = teamStats.reduce((sum, stat) => sum + stat.total_hold_time_in, 0);
    const inboundACWTime = teamStats.reduce((sum, stat) => sum + stat.total_acw_time_in, 0);
    const inboundTotal = inboundTalkTime + inboundHoldTime + inboundACWTime;
    const inboundAHT = inboundCalls > 0 ? calculateAHT(inboundTotal / inboundCalls) : 0;

    const outboundCalls = teamStats.reduce((sum, stat) => sum + stat.num_calls_out, 0);
    const outboundTalkTime = teamStats.reduce((sum, stat) => sum + stat.total_talk_time_out, 0);
    const outboundHoldTime = teamStats.reduce((sum, stat) => sum + stat.total_hold_time_out, 0);
    const outboundACWTime = teamStats.reduce((sum, stat) => sum + stat.total_acw_time_out, 0);
    const outboundTotal = outboundTalkTime + outboundHoldTime + outboundACWTime;
    const outboundAHT = outboundCalls > 0 ? calculateAHT(outboundTotal / outboundCalls) : 0;

    return {
      teamName,
      inboundCalls,
      inboundTalkTime,
      inboundHoldTime,
      inboundACWTime,
      inboundTotal,
      inboundAHT,
      outboundCalls,
      outboundTalkTime,
      outboundHoldTime,
      outboundACWTime,
      outboundTotal,
      outboundAHT,
    };
  };

  const handleDelete = async () => {
    try {
      const result = await deleteCallStatistics()
      if (result.success) {
        toast.success(result.message)
        fetchStatistics() // Refresh the statistics after deletion
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast.error('Fehler beim Löschen der Daten: ' + error.message)
    }
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
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Anrufstatistiken</h1>
          <p className="text-lg text-blue-700">Verwalten Sie Ihre Anrufstatistiken</p>
        </div>
        {/* Removed Excel Export Button */}
      </div>

      <div className="flex space-x-4 mb-8">
        <Button asChild variant="outline" className="bg-white hover:bg-blue-100 text-blue-900 border-blue-300 transition-colors">
          <Link href="/home">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Link>
        </Button>
        <Button asChild variant="outline" className="bg-white hover:bg-blue-100 text-blue-900 border-blue-300 transition-colors">
          <Link href="/agent-list">
            <Users className="mr-2 h-4 w-4" />
            Agentenverwaltung
          </Link>
        </Button>
        <Button asChild variant="outline" className="bg-white hover:bg-blue-100 text-blue-900 border-blue-300 transition-colors">
          <Link href="/agent-overview">
            <BarChart2 className="mr-2 h-4 w-4" />
            Agentenstatistik
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white shadow-md rounded-lg p-1 border border-blue-200">
          <TabsTrigger value="list" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <BarChart2 className="mr-2 h-4 w-4" />
            Anrufstatistiken
          </TabsTrigger>
          <TabsTrigger value="import" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-t-4 border-t-blue-500">
              <CardHeader>
                <CardTitle className="text-blue-800">Gesamt</CardTitle>
                <CardDescription className="text-blue-600">Alle Statistiken</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-600">{statistics.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-t-4 border-t-green-500">
              <CardHeader>
                <CardTitle className="text-blue-800">Teams</CardTitle>
                <CardDescription className="text-blue-600">Anzahl der Teams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">{uniqueTeams.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-t-4 border-t-purple-500">
              <CardHeader>
                <CardTitle className="text-blue-800">Agenten</CardTitle>
                <CardDescription className="text-blue-600">Anzahl der Agenten</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-purple-600">{uniqueAgents.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="w-full bg-white shadow-lg border border-blue-200">
            <CardHeader className="border-b border-blue-100">
              <CardTitle className="text-2xl text-blue-800">Anrufstatistiken</CardTitle>
              <CardDescription className="text-blue-600">
                {filteredStatistics.length} von {statistics.length} Statistiken angezeigt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Nach Namen oder Team suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900 placeholder-blue-400"
                    />
                  </div>
                  <div className="w-full md:w-[200px]">
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger className="w-full bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900">
                        <SelectValue placeholder="Team filtern" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-blue-300">
                        <SelectItem value="all" className="text-blue-900">Alle Teams</SelectItem>
                        {uniqueTeams
                          .filter(team => team.trim() !== '')
                          .map(team => (
                            <SelectItem key={team} value={team} className="text-blue-900">{team}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-[200px]">
                    <Select value={selectedDate} onValueChange={setSelectedDate}>
                      <SelectTrigger className="w-full bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900">
                        <SelectValue placeholder="Datum filtern" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-blue-300">
                        <SelectItem value="all" className="text-blue-900">Alle Daten</SelectItem>
                        {uniqueDates
                          .filter(date => date.trim() !== '')
                          .map(date => (
                            <SelectItem key={date} value={date} className="text-blue-900">{date}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-[200px]">
                    <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                      <SelectTrigger className="w-full bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900">
                        <SelectValue placeholder="Agent filtern" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-blue-300">
                        <SelectItem value="all" className="text-blue-900">Alle Agenten</SelectItem>
                        {uniqueAgents
                          .filter(agent => agent.trim() !== '')
                          .map(agent => (
                            <SelectItem key={agent} value={agent} className="text-blue-900">{agent}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-[200px]">
                    <Select value={selectedView} onValueChange={setSelectedView}>
                      <SelectTrigger className="w-full bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900">
                        <SelectValue placeholder="Ansicht wählen" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-blue-300">
                        <SelectItem value="agent" className="text-blue-900">Agenten-Ansicht</SelectItem>
                        <SelectItem value="team" className="text-blue-900">Team-Ansicht</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Card className="mt-6 bg-white shadow-lg border border-blue-200">
                  <CardHeader className="border-b border-blue-100">
                    <CardTitle className="text-2xl text-blue-800">
                      {selectedView === 'agent' ? 'Agentenübersicht' : 'Teamübersicht'}
                    </CardTitle>
                    <CardDescription className="text-blue-600">
                      {selectedView === 'agent' 
                        ? 'Detaillierte Statistiken für den ausgewählten Agenten'
                        : 'Detaillierte Statistiken für das ausgewählte Team'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedView === 'agent' && selectedAgent !== 'all' && (
                      <div className="space-y-4">
                        {(() => {
                          const agentStats = statistics.filter(stat => `${stat.first_name} ${stat.last_name}` === selectedAgent);
                          const inboundCalls = agentStats.reduce((sum, stat) => sum + stat.num_calls_answered, 0);
                          const inboundTalkTime = agentStats.reduce((sum, stat) => sum + stat.total_talk_time_in, 0);
                          const inboundHoldTime = agentStats.reduce((sum, stat) => sum + stat.total_hold_time_in, 0);
                          const inboundACWTime = agentStats.reduce((sum, stat) => sum + stat.total_acw_time_in, 0);
                          const inboundTotal = inboundTalkTime + inboundHoldTime + inboundACWTime;
                          const inboundAHT = inboundCalls > 0 ? calculateAHT(inboundTotal / inboundCalls) : 0;

                          const outboundCalls = agentStats.reduce((sum, stat) => sum + stat.num_calls_out, 0);
                          const outboundTalkTime = agentStats.reduce((sum, stat) => sum + stat.total_talk_time_out, 0);
                          const outboundHoldTime = agentStats.reduce((sum, stat) => sum + stat.total_hold_time_out, 0);
                          const outboundACWTime = agentStats.reduce((sum, stat) => sum + stat.total_acw_time_out, 0);
                          const outboundTotal = outboundTalkTime + outboundHoldTime + outboundACWTime;
                          const outboundAHT = outboundCalls > 0 ? calculateAHT(outboundTotal / outboundCalls) : 0;

                          return (
                            <Card key={selectedAgent} className="bg-blue-50 shadow-sm p-4">
                              <CardHeader className="p-4">
                                <CardTitle className="text-lg text-blue-800">{selectedAgent}</CardTitle>
                              </CardHeader>
                              <CardContent className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div className="bg-white p-3 rounded-lg shadow-sm">
                                    <h3 className="text-blue-800 font-semibold mb-2">Inbound</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <div className="text-blue-600 mb-1">Anrufanzahl</div>
                                        <div className="font-semibold text-lg text-blue-900">{inboundCalls}</div>
                                      </div>
                                      <div>
                                        <div className="text-blue-600 mb-1">Gesprächszeit (Sek.)</div>
                                        <div className="font-semibold text-lg text-blue-900">{inboundTalkTime}</div>
                                      </div>
                                      <div>
                                        <div className="text-blue-600 mb-1">Haltezeit (Sek.)</div>
                                        <div className="font-semibold text-lg text-blue-900">{inboundHoldTime}</div>
                                      </div>
                                      <div>
                                        <div className="text-blue-600 mb-1">ACW (Sek.)</div>
                                        <div className="font-semibold text-lg text-blue-900">{inboundACWTime}</div>
                                      </div>
                                      <div>
                                        <div className="text-blue-600 mb-1">Gesamt (Sek.)</div>
                                        <div className="font-semibold text-lg text-blue-900">{inboundTotal}</div>
                                      </div>
                                      <div>
                                        <div className="text-blue-600 mb-1">AHT (Sek.)</div>
                                        <div className="font-semibold text-lg text-blue-900">{inboundAHT}</div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="bg-white p-3 rounded-lg shadow-sm">
                                    <h3 className="text-blue-800 font-semibold mb-2">Outbound</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <div className="text-blue-600 mb-1">Anrufanzahl</div>
                                        <div className="font-semibold text-lg text-blue-900">{outboundCalls}</div>
                                      </div>
                                      <div>
                                        <div className="text-blue-600 mb-1">Gesprächszeit (Sek.)</div>
                                        <div className="font-semibold text-lg text-blue-900">{outboundTalkTime}</div>
                                      </div>
                                      <div>
                                        <div className="text-blue-600 mb-1">Haltezeit (Sek.)</div>
                                        <div className="font-semibold text-lg text-blue-900">{outboundHoldTime}</div>
                                      </div>
                                      <div>
                                        <div className="text-blue-600 mb-1">ACW (Sek.)</div>
                                        <div className="font-semibold text-lg text-blue-900">{outboundACWTime}</div>
                                      </div>
                                      <div>
                                        <div className="text-blue-600 mb-1">Gesamt (Sek.)</div>
                                        <div className="font-semibold text-lg text-blue-900">{outboundTotal}</div>
                                      </div>
                                      <div>
                                        <div className="text-blue-600 mb-1">AHT (Sek.)</div>
                                        <div className="font-semibold text-lg text-blue-900">{outboundAHT}</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })()}
                      </div>
                    )}
                    {selectedView === 'team' && (
                      <div className="space-y-4">
                        {selectedTeam === 'all' ? (
                          <p className="text-center text-blue-600">Bitte wählen Sie ein Team aus, um detaillierte Statistiken zu sehen.</p>
                        ) : (
                          (() => {
                            const teamStats = calculateTeamStats(selectedTeam);
                            return (
                              <Card key={teamStats.teamName} className="bg-blue-50 shadow-sm p-4">
                                <CardHeader className="p-4">
                                  <CardTitle className="text-lg text-blue-800">{teamStats.teamName}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="bg-white p-3 rounded-lg shadow-sm">
                                      <h3 className="text-blue-800 font-semibold mb-2">Inbound</h3>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <div className="text-blue-600 mb-1">Anrufanzahl</div>
                                          <div className="font-semibold text-lg text-blue-900">{teamStats.inboundCalls}</div>
                                        </div>
                                        <div>
                                          <div className="text-blue-600 mb-1">Gesprächszeit (Sek.)</div>
                                          <div className="font-semibold text-lg text-blue-900">{teamStats.inboundTalkTime}</div>
                                        </div>
                                        <div>
                                          <div className="text-blue-600 mb-1">Haltezeit (Sek.)</div>
                                          <div className="font-semibold text-lg text-blue-900">{teamStats.inboundHoldTime}</div>
                                        </div>
                                        <div>
                                          <div className="text-blue-600 mb-1">ACW (Sek.)</div>
                                          <div className="font-semibold text-lg text-blue-900">{teamStats.inboundACWTime}</div>
                                        </div>
                                        <div>
                                          <div className="text-blue-600 mb-1">Gesamt (Sek.)</div>
                                          <div className="font-semibold text-lg text-blue-900">{teamStats.inboundTotal}</div>
                                        </div>
                                        <div>
                                          <div className="text-blue-600 mb-1">AHT (Sek.)</div>
                                          <div className="font-semibold text-lg text-blue-900">{teamStats.inboundAHT}</div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg shadow-sm">
                                      <h3 className="text-blue-800 font-semibold mb-2">Outbound</h3>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <div className="text-blue-600 mb-1">Anrufanzahl</div>
                                          <div className="font-semibold text-lg text-blue-900">{teamStats.outboundCalls}</div>
                                        </div>
                                        <div>
                                          <div className="text-blue-600 mb-1">Gesprächszeit (Sek.)</div>
                                          <div className="font-semibold text-lg text-blue-900">{teamStats.outboundTalkTime}</div>
                                        </div>
                                        <div>
                                          <div className="text-blue-600 mb-1">Haltezeit (Sek.)</div>
                                          <div className="font-semibold text-lg text-blue-900">{teamStats.outboundHoldTime}</div>
                                        </div>
                                        <div>
                                          <div className="text-blue-600 mb-1">ACW (Sek.)</div>
                                          <div className="font-semibold text-lg text-blue-900">{teamStats.outboundACWTime}</div>
                                        </div>
                                        <div>
                                          <div className="text-blue-600 mb-1">Gesamt (Sek.)</div>
                                          <div className="font-semibold text-lg text-blue-900">{teamStats.outboundTotal}</div>
                                        </div>
                                        <div>
                                          <div className="text-blue-600 mb-1">AHT (Sek.)</div>
                                          <div className="font-semibold text-lg text-blue-900">{teamStats.outboundAHT}</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })()
                        )}
                      </div>
                    )}
                    {selectedView === 'agent' && selectedAgent === 'all' && (
                      <p className="text-center text-blue-600">Bitte wählen Sie einen Agenten aus, um detaillierte Statistiken zu sehen.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                  <CardHeader className="border-b border-blue-200">
                    <CardTitle className="text-xl text-blue-800">Spalten auswählen</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-4 p-6">
                    {Object.entries(selectedColumns).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2 bg-white rounded-lg px-4 py-2 shadow-sm border border-blue-200 hover:border-blue-400 transition-colors">
                        <Checkbox 
                          id={key} 
                          checked={value}
                          onCheckedChange={(checked) => 
                            setSelectedColumns({...selectedColumns, [key]: checked === true})
                          }
                          className="h-5 w-5 border-2 border-blue-400 data-[state=checked]:bg-blue-600"
                        />
                        <label htmlFor={key} className="text-sm font-medium text-blue-900 cursor-pointer select-none">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </label>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="flex justify-enditems-center mb-4"> {/* Added Excel Export Button */}
                  <Button 
                    onClick={exportToExcel}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Excel Export
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="ml-2">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Daten löschen
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Diese Aktion kann nicht rückgängig gemacht werden. Alle Anrufstatistiken werden dauerhaft aus der Datenbank gelöscht.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Löschen</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="w-full overflow-x-auto rounded-lg border border-blue-200">
                  <div className="w-full relative" style={{ height: '600px' }}>
                    <div className="overflow-auto absolute inset-0">
                      <table className="w-full bg-white [&_th]:leading-tight">
                        <thead className="bg-blue-50 sticky top-0 z-10tight">
                          <tr>
                            <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Team</th>
                            <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Nachname</th>
                            <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Vorname</th>
                            <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Datum</th>
                            {selectedColumns.inboundCalls && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Inbound Anrufe</th>}
                            {selectedColumns.inboundTalkTime && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Inbound{'\n'}Gesprächszeit</th>}
                            {selectedColumns.inboundHoldTime && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Inbound{'\n'}Haltezeit</th>}
                            {selectedColumns.inboundACW && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Inbound ACW</th>}
                            {selectedColumns.inboundAHT && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Inbound AHT</th>}
                            {selectedColumns.outboundCalls && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Outbound Anrufe</th>}
                            {selectedColumns.outboundTalkTime && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Outbound{'\n'}Gesprächszeit</th>}
                            {selectedColumns.outboundHoldTime && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Outbound{'\n'}Haltezeit</th>}
                            {selectedColumns.outboundACW && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Outbound ACW</th>}
                            {selectedColumns.outboundAHT && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Outbound AHT</th>}
                            {selectedColumns.notReadyReason && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Not Ready Grund</th>}
                            {selectedColumns.notReadyTime && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Not Ready Zeit</th>}
                            {selectedColumns.totalReadyTime && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Gesamte Bereitzeit</th>}
                            {selectedColumns.totalRingingTimeIn && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Klingelzeit eingehend</th>}
                            {selectedColumns.totalRingingTimeOut && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Klingelzeit ausgehend</th>}
                            {selectedColumns.totalLoginTime && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Gesamte Anmeldezeit</th>}
                            {selectedColumns.callsAnsweredOT && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Anrufe beantwortet (Überlauf)</th>}
                            {selectedColumns.callsRejected && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Abgelehnte Anrufe</th>}
                            {selectedColumns.serviceName && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Service Name</th>}
                            {selectedColumns.timeGroup && <th className="text-left text-blue-900 font-semibold sticky top-0 z-10 bg-blue-50 text-sm whitespace-normal px-4 py-2">Zeitgruppe</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStatistics.length === 0 ? (
                            <tr>
                              <td colSpan={26} className="text-center py-8">
                                <AlertCircle className="mx-auto h-12 w-12 text-blue-400 mb-2" />
                                <p className="text-blue-600 text-lg">Keine Statistiken gefunden</p>
                              </td>
                            </tr>
                          ) : (
                            filteredStatistics.map((stat, index) => (
                              <tr key={index} className="hover:bg-blue-50 transition-colors">
                                <td className="text-blue-900 px-4 py-2 text-sm">{stat.team_name}</td>
                                <td className="text-blue-900 px-4 py-2 text-sm">{stat.last_name}</td>
                                <td className="text-blue-900 px-4 py-2 text-sm">{stat.first_name}</td>
                                <td className="text-blue-900 px-4 py-2 text-sm">{stat.datecolumn}</td>
                                {selectedColumns.inboundCalls && <td className="text-blue-900 px-4 py-2 text-sm">{stat.num_calls_answered}</td>}
                                {selectedColumns.inboundTalkTime && <td className="text-blue-900 px-4 py-2 text-sm">{stat.total_talk_time_in}</td>}
                                {selectedColumns.inboundHoldTime && <td className="text-blue-900 px-4 py-2 text-sm">{stat.total_hold_time_in}</td>}
                                {selectedColumns.inboundACW && <td className="text-blue-900 px-4 py-2 text-sm">{stat.total_acw_time_in}</td>}
                                {selectedColumns.inboundAHT && <td className="text-blue-900 px-4 py-2 text-sm">{stat.inbound_aht}</td>}
                                {selectedColumns.outboundCalls && <td className="text-blue-900 px-4 py-2 text-sm">{stat.num_calls_out}</td>}
                                {selectedColumns.outboundTalkTime && <td className="text-blue-900 px-4 py-2 text-sm">{stat.total_talk_time_out}</td>}
                                {selectedColumns.outboundHoldTime && <td className="text-blue-900 px-4 py-2 text-sm">{stat.total_hold_time_out}</td>}
                                {selectedColumns.outboundACW && <td className="text-blue-900 px-4 py-2 text-sm">{stat.total_acw_time_out}</td>}
                                {selectedColumns.outboundAHT && <td className="text-blue-900 px-4 py-2 text-sm">{stat.outbound_aht}</td>}
                                {selectedColumns.notReadyReason && <td className="text-blue-900 px-4 py-2 text-sm">{stat.not_ready_reason}</td>}
                                {selectedColumns.notReadyTime && <td className="text-blue-900 px-4 py-2 text-sm">{stat.not_ready_time}</td>}
                                {selectedColumns.totalReadyTime && <td className="text-blue-900 px-4 py-2 text-sm">{stat.total_ready_time}</td>}
                                {selectedColumns.totalRingingTimeIn && <td className="text-blue-900 px-4 py-2 text-sm">{stat.total_ringing_time_in}</td>}
                                {selectedColumns.totalRingingTimeOut && <td className="text-blue-900 px-4 py-2 text-sm">{stat.total_ringing_time_out}</td>}
                                {selectedColumns.totalLoginTime && <td className="text-blue-900 px-4 py-2 text-sm">{stat.total_login_time}</td>}
                                {selectedColumns.callsAnsweredOT && <td className="text-blue-900 px-4 py-2 text-sm">{stat.num_calls_answered_ot}</td>}
                                {selectedColumns.callsRejected && <td className="text-blue-900 px-4 py-2 text-sm">{stat.num_calls_rejected}</td>}
                                {selectedColumns.serviceName && <td className="text-blue-900 px-4 py-2 text-sm">{stat.service_name}</td>}
                                {selectedColumns.timeGroup && <td className="text-blue-900 px-4 py-2 text-sm">{stat.timegroupcolumn30}</td>}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <ImportTab onImportComplete={fetchStatistics} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CallStatistics

