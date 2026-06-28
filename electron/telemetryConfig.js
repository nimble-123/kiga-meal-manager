// Aptabase-Konfiguration für anonyme, opt-in Nutzungsstatistiken.
// Der App-Key ist KEIN Geheimnis (publishable, wie eine Analytics-Mess-ID) und darf
// eingecheckt werden. Solange er leer ist, ist die Telemetrie komplett deaktiviert.
//
// Einrichtung: Account auf https://aptabase.com anlegen (EU-Region empfohlen),
// App erstellen, den App-Key (Form "A-EU-XXXXXXXXXX") hier eintragen.
module.exports = {
  APTABASE_APP_KEY: '', // leer = Telemetrie aus
  // Optional: eigener Host bei Self-Hosting; sonst leer lassen.
  APTABASE_HOST: '',
};
