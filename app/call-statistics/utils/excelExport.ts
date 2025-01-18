import * as XLSX from 'xlsx';
import { CallStatistic } from '../actions';

export function exportToExcel(data: CallStatistic[], fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Anrufstatistiken");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
