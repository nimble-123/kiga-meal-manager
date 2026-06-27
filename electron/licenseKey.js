// Eingebetteter Ed25519-PUBLIC-Key zur Verifikation von Lizenzschlüsseln.
// Enthält KEIN Geheimnis — der zugehörige Private Key bleibt beim Entwickler
// (scripts/license/private-key.pem, gitignored, nicht ausgeliefert).
// Erzeugt via: node scripts/license/generate-license.mjs keygen

module.exports = {
  KEY_VERSION: 1,
  PUBLIC_KEY_PEM: `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAt/VPK2BWyCO0V7zslHMTF+vnxyckdJAJ0OwELV3Glng=
-----END PUBLIC KEY-----
`,
};
