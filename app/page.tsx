import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { BarChart3, FileSpreadsheet } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">CSV-Import</h1>
          <div className="space-x-4">
            <Link href="/auswertung">
              <Button variant="outline">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Zur Auswertung
              </Button>
            </Link>
            <Link href="/statistik">
              <Button>
                <BarChart3 className="mr-2 h-4 w-4" />
                Zur Statistik
              </Button>
            </Link>
          </div>
        </div>
        {/* CSVAnalyzer wurde hier entfernt */}
      </div>
    </main>
  )
}

