export function sendEmail(subject, body) {
  if (window.api?.openEmail) {
    window.api.openEmail({ subject, body });
  } else {
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  }
}

export function sendEmailWithAttachment(subject, body, filename, data, mimeType) {
  if (window.api?.sendEmailWithAttachment) {
    window.api.sendEmailWithAttachment({ subject, body, filename, data });
  } else {
    // Browser-Fallback: Anhang herunterladen + mailto öffnen
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  }
}
