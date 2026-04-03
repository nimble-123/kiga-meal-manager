export function downloadCSV(filename, csvContent) {
  if (window.api?.saveCSV) {
    window.api.saveCSV({ filename, content: csvContent });
  } else {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
