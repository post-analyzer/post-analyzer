'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { updateAgent } from '../actions'

interface Agent {
  id: string
  name: string
  gruppe: string
  status: 'aktiv' | 'off'
  updated_at: string
}

interface EditAgentModalProps {
  agent: Agent | null
  isOpen: boolean
  onClose: () => void
  onAgentUpdated: () => void
  uniqueGruppen: string[]
}

export function EditAgentModal({ agent, isOpen, onClose, onAgentUpdated, uniqueGruppen }: EditAgentModalProps) {
  const [editedAgent, setEditedAgent] = useState<Agent | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (agent) {
      setEditedAgent({ ...agent })
    }
  }, [agent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editedAgent) return

    setIsLoading(true)
    try {
      const updatedAgent = await updateAgent(editedAgent.id, {
        name: editedAgent.name,
        gruppe: editedAgent.gruppe,
        status: editedAgent.status
      })
      console.log('Agent updated:', updatedAgent);
      toast.success('Agent erfolgreich aktualisiert')
      onAgentUpdated()
      onClose()
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren des Agenten:', error)
      toast.error(`Fehler beim Aktualisieren des Agenten: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!editedAgent) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-blue-900">Agent bearbeiten</DialogTitle>
          <DialogDescription className="text-blue-700">
            Ändern Sie die Details des Agenten und speichern Sie die Änderungen.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-blue-900">
                Name
              </Label>
              <Input
                id="name"
                value={editedAgent.name}
                onChange={(e) => setEditedAgent({ ...editedAgent, name: e.target.value })}
                className="col-span-3 bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gruppe" className="text-right text-blue-900">
                Gruppe
              </Label>
              <Select
                value={editedAgent.gruppe}
                onValueChange={(value) => setEditedAgent({ ...editedAgent, gruppe: value })}
              >
                <SelectTrigger className="col-span-3 bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900">
                  <SelectValue placeholder="Gruppe wählen" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-300">
                  {uniqueGruppen.map((gruppe) => (
                    <SelectItem key={gruppe} value={gruppe} className="text-blue-900">
                      {gruppe}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right text-blue-900">
                Status
              </Label>
              <Select
                value={editedAgent.status}
                onValueChange={(value: 'aktiv' | 'off') => setEditedAgent({ ...editedAgent, status: value })}
              >
                <SelectTrigger className="col-span-3 bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900">
                  <SelectValue placeholder="Status wählen" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-300">
                  <SelectItem value="aktiv" className="text-blue-900">Aktiv</SelectItem>
                  <SelectItem value="off" className="text-blue-900">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isLoading ? 'Wird aktualisiert...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

