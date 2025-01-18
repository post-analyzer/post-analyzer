'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertCircle, Home, Users, ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, ChevronRightIcon } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { getCallStatistics, CallStatistic } from '../call-statistics/actions'
import * as XLSX from 'xlsx'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AgentOverview() {
  const [statistics, setStatistics] = useState<CallStatistic[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [expandedTeams, setExpandedTeams] = useState<string[]>([])
  const [teamSearchTerms, setTeamSearchTerms] = useState<{[key: string]: string}>({})
  const [teamPages, setTeamPages] = useState<{[key: string]: number}>({})
  const [agentsPerPage, setAgentsPerPage] = useState(10)

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

  const agentsByTeam = useMemo(() => {
    const teams: { [key: string]: string[] } = {}
    statistics.forEach(stat => {
      const agentName = `${stat.first_name} ${stat.last_name}`
      if (!teams[stat.team_name]) {
        teams[stat.team_name] = []
      }
      if (!teams[stat.team_name].includes(agentName)) {
        teams[stat.team_name].push(agentName)
      }
    })
    return teams
  }, [statistics])

  const filteredTeams = useMemo(() => {
    if (!searchTerm) return agentsByTeam
    const filtered: { [key: string]: string[] } = {}
    Object.entries(agentsByTeam).forEach(([team, agents]) => {
      const filteredAgents = agents.filter(agent =>
        agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (filteredAgents.length > 0) {
        filtered[team] = filteredAgents
      }
    })
    return filtered
  }, [agentsByTeam, searchTerm])

  const calculateAgentStats = useCallback((agentName: string) => {
    const agentStats = statistics.filter(stat => `${stat.first_name} ${stat.last_name}` === agentName);
    const inboundCalls = agentStats.reduce((sum, stat) => sum + stat.num_calls_answered, 0);
    const inboundTalkTime = agentStats.reduce((sum, stat) => sum + stat.total_talk_time_in, 0);
    const inboundHoldTime = agentStats.reduce((sum, stat) => sum + stat.total_hold_time_in, 0);
    const inboundACWTime = agentStats.reduce((sum, stat) => sum + stat.total_acw_time_in, 0);
    const inboundTotal = inboundTalkTime + inboundHoldTime + inboundACWTime;
    const inboundAHT = inboundCalls > 0 ? inboundTotal / inboundCalls : 0;

    const outboundCalls = agentStats.reduce((sum, stat) => sum + stat.num_calls_out, 0);
    const outboundTalkTime = agentStats.reduce((sum, stat) => sum + stat.total_talk_time_out, 0);
    const outboundHoldTime = agentStats.reduce((sum, stat) => sum + stat.total_hold_time_out, 0);
    const outboundACWTime = agentStats.reduce((sum, stat) => sum + stat.total_acw_time_out, 0);
    const outboundTotal = outboundTalkTime + outboundHoldTime + outboundACWTime;
    const outboundAHT = outboundCalls > 0 ? outboundTotal / outboundCalls : 0;

    return {
      agentName,
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
  }, [statistics]);

  const exportToExcel = useCallback(() => {
    try {
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('de-DE', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
      const workbook = XLSX.utils.book_new();
      const data = Object.entries(filteredTeams).flatMap(([team, agents]) =>
        agents.map(agent => {
          const stats = calculateAgentStats(agent);
          return {
            'Datum': formattedDate,
            'Team': team,
            'Agent Name': stats.agentName,
            'Inbound Anrufe': stats.inboundCalls,
            'Inbound Gesprächszeit (s)': stats.inboundTalkTime,
            'Inbound Haltezeit (s)': stats.inboundHoldTime,
            'Inbound ACW Zeit (s)': stats.inboundACWTime,
            'Inbound Gesamtzeit (s)': stats.inboundTotal,
            'Inbound AHT (s)': stats.inboundAHT.toFixed(2),
            'Outbound Anrufe': stats.outboundCalls,
            'Outbound Gesprächszeit (s)': stats.outboundTalkTime,
            'Outbound Haltezeit (s)': stats.outboundHoldTime,
            'Outbound ACW Zeit (s)': stats.outboundACWTime,
            'Outbound Gesamtzeit (s)': stats.outboundTotal,
            'Outbound AHT (s)': stats.outboundAHT.toFixed(2),
          };
        })
      );
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Agentenstatistiken");
      XLSX.writeFile(workbook, `agentenstatistiken_${formattedDate.replace(/\./g, '-')}.xlsx`);
      toast.success('Export erfolgreich');
    } catch (error) {
      console.error('Fehler beim Exportieren:', error);
      toast.error('Fehler beim Exportieren der Daten');
    }
  }, [filteredTeams, calculateAgentStats]);

  const toggleTeam = (team: string) => {
    setExpandedTeams(prev =>
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    )
  }

  const handleTeamSearch = (team: string, value: string) => {
    setTeamSearchTerms(prev => ({ ...prev, [team]: value }))
    setTeamPages(prev => ({ ...prev, [team]: 1 }))
  }

  const getFilteredAgents = (team: string, agents: string[]) => {
    const teamSearchTerm = teamSearchTerms[team] || ''
    return agents.filter(agent => 
      agent.toLowerCase().includes(teamSearchTerm.toLowerCase())
    )
  }

  const getPaginatedAgents = (team: string, agents: string[]) => {
    const filteredAgents = getFilteredAgents(team, agents)
    const page = teamPages[team] || 1
    const start = (page - 1) * agentsPerPage
    const end = start + agentsPerPage
    return filteredAgents.slice(start, end)
  }

  const renderPagination = (team: string, agents: string[]) => {
    const filteredAgents = getFilteredAgents(team, agents)
    const totalPages = Math.ceil(filteredAgents.length / agentsPerPage)
    const currentPage = teamPages[team] || 1

    return (
      <div className="flex items-center justify-between mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTeamPages(prev => ({ ...prev, [team]: 1 }))}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTeamPages(prev => ({ ...prev, [team]: Math.max(1, (prev[team] || 1) - 1) }))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="mx-2">
          Seite {currentPage} von {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTeamPages(prev => ({ ...prev, [team]: Math.min(totalPages, (prev[team] || 1) + 1) }))}
          disabled={currentPage === totalPages}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTeamPages(prev => ({ ...prev, [team]: totalPages }))}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    )
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
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Agentenübersicht</h1>
          <p className="text-lg text-blue-700">Detaillierte Statistiken für alle Agenten</p>
        </div>
      </div>

      <div className="flex space-x-4 mb-8">
        <Button asChild variant="outline" className="bg-white hover:bg-blue-100 text-blue-700 border-blue-300 transition-colors">
          <Link href="/home">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Link>
        </Button>
        <Button asChild variant="outline" className="bg-white hover:bg-blue-100 text-blue-700 border-blue-300 transition-colors">
          <Link href="/call-statistics">
            <Users className="mr-2 h-4 w-4" />
            Anrufstatistiken
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <Input
          placeholder="Nach Agenten oder Teams suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900 placeholder-blue-400"
        />
        <div className="flex items-center space-x-4">
          <Select value={agentsPerPage.toString()} onValueChange={(value) => setAgentsPerPage(Number(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Agenten pro Seite" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 Agenten pro Seite</SelectItem>
              <SelectItem value="10">10 Agenten pro Seite</SelectItem>
              <SelectItem value="20">20 Agenten pro Seite</SelectItem>
              <SelectItem value="50">50 Agenten pro Seite</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={exportToExcel} 
            className="bg-green-500 hover:bg-green-600 text-white"
            aria-label="Exportiere Agentenstatistiken als Excel-Datei"
          >
            Export to Excel
          </Button>
        </div>
      </div>

      {Object.keys(filteredTeams).length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-12 w-12 text-blue-400 mb-2" />
          <p className="text-blue-600 text-lg">Keine Agenten oder Teams gefunden</p>
        </div>
      ) : (
        Object.entries(filteredTeams).map(([team, agents]) => (
          <Collapsible key={team} open={expandedTeams.includes(team)} onOpenChange={() => toggleTeam(team)}>
            <Card className="mb-4 bg-white shadow-lg hover:shadow-xl transition-shadow border-t-4 border-t-blue-500">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-blue-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-blue-800">{team}</CardTitle>
                    {expandedTeams.includes(team) ? (
                      <ChevronDown className="h-5 w-5 text-blue-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <CardDescription className="text-blue-600">{agents.length} Agenten</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <Input
                    placeholder="Agenten in diesem Team suchen..."
                    value={teamSearchTerms[team] || ''}
                    onChange={(e) => handleTeamSearch(team, e.target.value)}
                    className="mb-4 bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900 placeholder-blue-400"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getPaginatedAgents(team, agents).map((agent) => {
                      const agentStats = calculateAgentStats(agent);
                      return (
                        <Card key={agent} className="bg-blue-50 shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-lg text-blue-800">{agent}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <h3 className="text-blue-800 font-semibold mb-2">Inbound</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <div className="text-blue-600 mb-1">Anrufanzahl</div>
                                    <div className="font-semibold text-lg text-blue-900">{agentStats.inboundCalls}</div>
                                  </div>
                                  <div>
                                    <div className="text-blue-600 mb-1">Gesprächszeit (Sek.)</div>
                                    <div className="font-semibold text-lg text-blue-900">{agentStats.inboundTalkTime}</div>
                                  </div>
                                  <div>
                                    <div className="text-blue-600 mb-1">Haltezeit (Sek.)</div>
                                    <div className="font-semibold text-lg text-blue-900">{agentStats.inboundHoldTime}</div>
                                  </div>
                                  <div>
                                    <div className="text-blue-600 mb-1">ACW (Sek.)</div>
                                    <div className="font-semibold text-lg text-blue-900">{agentStats.inboundACWTime}</div>
                                  </div>
                                  <div>
                                    <div className="text-blue-600 mb-1">Gesamt (Sek.)</div>
                                    <div className="font-semibold text-lg text-blue-900">{agentStats.inboundTotal}</div>
                                  </div>
                                  <div>
                                    <div className="text-blue-600 mb-1">AHT (Sek.)</div>
                                    <div className="font-semibold text-lg text-blue-900">{agentStats.inboundAHT.toFixed(2)}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <h3 className="text-blue-800 font-semibold mb-2">Outbound</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <div className="text-blue-600 mb-1">Anrufanzahl</div>
                                    <div className="font-semibold text-lg text-blue-900">{agentStats.outboundCalls}</div>
                                  </div>
                                  <div>
                                    <div className="text-blue-600 mb-1">Gesprächszeit (Sek.)</div>
                                    <div className="font-semibold text-lg text-blue-900">{agentStats.outboundTalkTime}</div>
                                  </div>
                                  <div>
                                    <div className="text-blue-600 mb-1">Haltezeit (Sek.)</div>
                                    <div className="font-semibold text-lg text-blue-900">{agentStats.outboundHoldTime}</div>
                                  </div>
                                  <div>
                                    <div className="text-blue-600 mb-1">ACW (Sek.)</div>
                                    <div className="font-semibold text-lg text-blue-900">{agentStats.outboundACWTime}</div>
                                  </div>
                                  <div>
                                    <div className="text-blue-600 mb-1">Gesamt (Sek.)</div>
                                    <div className="font-semibold text-lg text-blue-900">{agentStats.outboundTotal}</div>
                                  </div>
                                  <div>
                                    <div className="text-blue-600 mb-1">AHT (Sek.)</div>
                                    <div className="font-semibold text-lg text-blue-900">{agentStats.outboundAHT.toFixed(2)}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  {renderPagination(team, agents)}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))
      )}
    </div>
  )
}

