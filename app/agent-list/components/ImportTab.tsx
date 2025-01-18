'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { importAgents } from '../actions'
import { Upload } from 'lucide-react'
import Papa from 'papaparse'
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImportTabProps {
  onImportComplete: () => void;
}

export function ImportTab({ onImportComplete }: ImportTabProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
    }
  }

  const processExcelFile = async (buffer: ArrayBuffer) => {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    return XLSX.utils.sheet_to_json(worksheet) as Array<{
      'Agent Name': string
      'Gruppe': string
      'Status': string
    }>
  }

  const processCsvFile = (file: File): Promise<Array<{ 'Agent Name': string; 'Gruppe': string; 'Status': string }>> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const data = results.data.map((row: any) => ({
            'Agent Name': row['Agent Name'] || row['name'] || row['Name'] || '',
            'Gruppe': row['Gruppe'] || row['gruppe'] || row['Group'] || 'DE',
            'Status': row['Status'] || row['status'] || 'aktiv'
          }))
          resolve(data)
        },
        error: (error) => {
          reject(error)
        }
      })
    })
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Bitte wählen Sie zuerst eine Datei aus.')
      return
    }

    setUploading(true)
    setProgress(0)
    setImportResult(null)

    try {
      let jsonData;
      const fileExtension = file.name.split('.').pop()?.toLowerCase()

      if (fileExtension === 'csv') {
        jsonData = await processCsvFile(file)
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const buffer = await file.arrayBuffer()
        jsonData = await processExcelFile(buffer)
      } else {
        throw new Error('Nicht unterstütztes Dateiformat. Bitte verwenden Sie .csv, .xlsx oder .xls Dateien.')
      }

      if (!jsonData || jsonData.length === 0) {
        throw new Error('Die Datei enthält keine gültigen Daten')
      }

      const newAgents = jsonData.map(row => ({
        name: row['Agent Name'],
        gruppe: row['Gruppe'] || 'DE',
        status: row['Status']?.toLowerCase() === 'aktiv' ? 'aktiv' : 'off',
      })).filter(agent => agent.name)

      if (newAgents.length === 0) {
        throw new Error('Keine gültigen Agentendaten in der Datei gefunden')
      }

      const progressInterval = setInterval(() => {
        setProgress(prev => (prev >= 90 ? 90 : prev + 10))
      }, 500)

      const result = await importAgents(newAgents)

      clearInterval(progressInterval)
      setProgress(100)

      const message = `Import abgeschlossen: ${result.importedCount} neue Agenten importiert, ${result.updatedCount} aktualisiert, ${result.errorCount} Fehler`
      setImportResult({ success: true, message })
      toast.success(message)
      
      onImportComplete()
    } catch (error: any) {
      console.error('Fehler beim Import:', error)
      setImportResult({ success: false, message: error.message || 'Fehler beim Import der Datei' })
      toast.error(error.message || 'Fehler beim Import der Datei')
    } finally {
      setUploading(false)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agenten importieren</CardTitle>
        <CardDescription>
          Laden Sie eine Excel-Datei (.xlsx, .xls) oder CSV-Datei hoch, um Agenten zu importieren oder zu aktualisieren
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange} 
            accept=".xlsx,.xls,.csv" 
            className="hidden"
          />
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          {file ? (
            <p>Ausgewählte Datei: {file.name}</p>
          ) : (
            <div className="space-y-2">
              <p className="font-medium">Datei hier hinziehen</p>
              <p className="text-sm text-muted-foreground">oder klicken, um auszuwählen</p>
              <p className="text-xs text-muted-foreground">(Unterstützte Formate: .xlsx, .xls, .csv)</p>
            </div>
          )}
        </div>
        {file && (
          <Button 
            onClick={handleImport} 
            disabled={uploading} 
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Wird importiert...' : 'Import starten'}
          </Button>
        )}
        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">
              {progress === 100 ? 'Abgeschlossen' : 'Wird importiert...'}
            </p>
          </div>
        )}
        {importResult && (
          <Alert className={`mt-4 ${importResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <AlertDescription>{importResult.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

