export function sendEmail(subject, body) {
  if (window.api?.openEmail) {
    window.api.openEmail({ subject, body });
  } else {
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  }
}

export function sendEmailWithCSV(subject, body, csvFilename, csvContent) {
  if (window.api?.sendEmailWithCSV) {
    window.api.sendEmailWithCSV({ subject, body, csvFilename, csvContent });
  } else {
    // Browser-Fallback: CSV herunterladen + mailto öffnen
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = csvFilename;
    a.click();
    URL.revokeObjectURL(url);
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  }
}
