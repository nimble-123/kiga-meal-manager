// Reine Krypto-Funktionen für Lizenzschlüssel (keine electron-store-Abhängigkeit,
// damit isoliert testbar). Verifikation gegen einen Ed25519-Public-Key.
const crypto = require('crypto');
const { PUBLIC_KEY_PEM } = require('./licenseKey');

// Token-Format: base64url(payloadJSON) + "." + base64url(ed25519Signatur).
// Prüft die Signatur gegen den übergebenen Public Key und gibt das Payload-Objekt
// (mind. { name }) zurück oder null bei ungültig/manipuliert/fehlerhaft.
function verifyTokenWithKey(token, publicKeyPem) {
  try {
    const [p, s] = String(token).trim().split('.');
    if (!p || !s) return null;
    const payloadBuf = Buffer.from(p, 'base64url');
    const sig = Buffer.from(s, 'base64url');
    const pub = crypto.createPublicKey(publicKeyPem);
    if (!crypto.verify(null, payloadBuf, pub, sig)) return null;
    const payload = JSON.parse(payloadBuf.toString('utf8'));
    if (!payload || !payload.name) return null;
    // Zukunft (optional): if (payload.exp && Date.now() > Date.parse(payload.exp)) return null;
    return payload;
  } catch {
    return null;
  }
}

// Verifikation gegen den eingebetteten Public Key (Produktivpfad).
function verifyToken(token) {
  return verifyTokenWithKey(token, PUBLIC_KEY_PEM);
}

// Deterministischer Verschlüsselungs-Key aus dem Token (nie persistiert).
function deriveKey(token) {
  return crypto.createHash('sha256').update(String(token).trim()).digest('hex');
}

module.exports = { verifyToken, verifyTokenWithKey, deriveKey };
