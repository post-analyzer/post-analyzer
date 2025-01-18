'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { Upload } from 'lucide-react'
import { importCallStatistics } from '../actions'
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ImportTab({ onImportComplete }: { onImportComplete: () => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      toast.error('Bitte nur Excel oder CSV Dateien hochladen')
      return
    }

    setIsLoading(true)
    setProgress(0)
    setImportResult(null)
    try {
      console.log('Starting file import process')
      const formData = new FormData()
      formData.append('file', file)

      console.log('Calling importCallStatistics')
      const result = await importCallStatistics(formData)
      console.log('Import result:', result)
      
      if (result.success) {
        setImportResult({ success: true, message: result.message })
        toast.success('Import erfolgreich abgeschlossen')
        onImportComplete()
      } else {
        setImportResult({ success: false, message: result.error || 'Import fehlgeschlagen' })
        toast.error(result.error || 'Import fehlgeschlagen')
      }
    } catch (error) {
      console.error('Fehler beim Importieren:', error)
      setImportResult({ success: false, message: `Fehler beim Importieren der Datei: ${error.message}` })
      toast.error(`Fehler beim Importieren der Datei: ${error.message}`)
    } finally {
      setIsLoading(false)
      setProgress(100)
    }
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      await processFile(file)
    }
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isLoading) {
      interval = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress + 10
          return newProgress > 90 ? 90 : newProgress
        })
      }, 500)
    }
    return () => clearInterval(interval)
  }, [isLoading])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiken importieren</CardTitle>
        <CardDescription>
          Laden Sie eine Excel-Datei (.xlsx, .xls) oder CSV-Datei hoch, um Statistiken zu importieren oder zu aktualisieren
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`relative h-[200px] rounded-lg border-2 border-dashed transition-colors ${
            isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileSelect}
            disabled={isLoading}
          />
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="flex flex-col items-center justify-center text-center">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Wird importiert...</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg">Datei hier hinziehen</h3>
                  <p className="text-sm text-muted-foreground">oder klicken, um auszuwählen</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    (Unterstützte Formate: .xlsx, .xls, .csv)
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        {isLoading && (
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center mt-2">{progress}% abgeschlossen</p>
          </div>
        )}
        {importResult && (
          <Alert className={`mt-4 ${importResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <AlertTitle>{importResult.success ? 'Import erfolgreich' : 'Import fehlgeschlagen'}</AlertTitle>
            <AlertDescription>{importResult.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

