import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CallStatistic } from './actions';

export const exportFilteredToExcel = (data: CallStatistic[], selectedColumns: Record<string, boolean>) => {
  // Überprüfen Sie, ob Daten vorhanden sind
  if (data.length === 0) {
    console.error('Keine Daten zum Exportieren vorhanden');
    return;
  }

  // Erstellen Sie ein Array von Objekten, das nur die ausgewählten Spalten enthält
  const filteredData = data.map(stat => {
    const filteredStat: Record<string, any> = {};
    Object.entries(selectedColumns).forEach(([key, isSelected]) => {
      if (isSelected) {
        filteredStat[key] = stat[key as keyof CallStatistic];
      }
    });
    return filteredStat;
  });

  // Erstellen Sie ein Arbeitsblatt aus den gefilterten Daten
  const worksheet = XLSX.utils.json_to_sheet(filteredData);

  // Formatieren Sie die Spaltenüberschriften
  const header = Object.keys(filteredData[0]);
  const wscols = header.map(h => ({ wch: Math.max(...filteredData.map(row => row[h] ? row[h].toString().length : 0), h.length) }));
  worksheet['!cols'] = wscols;

  // Erstellen Sie ein neues Arbeitsbuch und fügen Sie das Arbeitsblatt hinzu
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Anrufstatistiken");

  // Generieren Sie den Dateinamen mit aktuellem Datum und Uhrzeit
  const currentDate = new Date();
  const formattedDate = format(currentDate, "dd.MM.yyyy_HH-mm", { locale: de });
  const fullFileName = `Gefilterte_Anrufstatistiken_${formattedDate}.xlsx`;

  // Schreiben Sie die Excel-Datei
  XLSX.writeFile(workbook, fullFileName);

  console.log(`Excel-Datei wurde erfolgreich erstellt: ${fullFileName}`);
};

