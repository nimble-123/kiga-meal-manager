// Utility: Erzeugt ein neues Child-Objekt mit Defaults
export function createChild(data, index = 0) {
  return {
    id: data.id || `c${Date.now()}_${index}`,
    name: data.name || '',
    gruppe: data.gruppe || '',
    but: !!data.but,
    zahlungspfl: data.zahlungspfl || '',
    adresse: data.adresse || '',
    kassenzeichen: data.kassenzeichen || '',
    hinweise: data.hinweise || '',
    status: data.status || 'aktiv',
    eintritt: data.eintritt || '',
    austritt: data.austritt || '',
  };
}
