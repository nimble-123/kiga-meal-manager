#!/usr/bin/env node
// Entwickler-CLI zum Erzeugen von Lizenzschlüsseln (Ed25519).
// Wird NICHT mit der App ausgeliefert (scripts/ ist nicht in package.json build.files).
//
// Nutzung:
//   node scripts/license/generate-license.mjs keygen
//       -> erzeugt ein Schlüsselpaar. Private Key -> scripts/license/private-key.pem (gitignored).
//          Public Key (SPKI-PEM) wird ausgegeben -> in electron/licenseKey.js eintragen.
//
//   node scripts/license/generate-license.mjs sign --name "KiGa Mitte" [--date 2026-06-27] [--out kiga-mitte.lic]
//       -> signiert eine Lizenz und gibt den Lizenzschlüssel aus (optional in Datei).

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRIVATE_KEY_PATH = path.join(__dirname, 'private-key.pem');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[key] = val;
    }
  }
  return args;
}

function keygen() {
  if (fs.existsSync(PRIVATE_KEY_PATH)) {
    console.error(`Abbruch: ${PRIVATE_KEY_PATH} existiert bereits. Zum Neu-Erzeugen erst löschen.`);
    process.exit(1);
  }
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const pubPem = publicKey.export({ type: 'spki', format: 'pem' });
  fs.writeFileSync(PRIVATE_KEY_PATH, privPem, { mode: 0o600 });
  console.log(`Private Key gespeichert: ${PRIVATE_KEY_PATH} (NICHT committen!)\n`);
  console.log('Public Key — in electron/licenseKey.js als PUBLIC_KEY_PEM eintragen:\n');
  console.log(pubPem);
}

function sign(args) {
  if (!args.name || args.name === true) {
    console.error('Fehlt: --name "<Lizenznehmer>"');
    process.exit(1);
  }
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.error(`Kein Private Key gefunden (${PRIVATE_KEY_PATH}). Erst "keygen" ausführen.`);
    process.exit(1);
  }
  const privateKey = crypto.createPrivateKey(fs.readFileSync(PRIVATE_KEY_PATH));
  const iat = args.date && args.date !== true ? args.date : new Date().toISOString().slice(0, 10);
  const payload = { name: args.name, iat };
  const payloadBuf = Buffer.from(JSON.stringify(payload), 'utf8');
  const sig = crypto.sign(null, payloadBuf, privateKey);
  const token = `${payloadBuf.toString('base64url')}.${sig.toString('base64url')}`;

  console.log(`\nLizenznehmer: ${payload.name}`);
  console.log(`Ausgestellt:  ${payload.iat}`);
  console.log(`\nLizenzschlüssel:\n`);
  console.log(token);
  console.log('');

  if (args.out && args.out !== true) {
    fs.writeFileSync(args.out, token + '\n', 'utf8');
    console.log(`Gespeichert: ${args.out}\n`);
  }
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'keygen') {
  keygen();
} else if (cmd === 'sign') {
  sign(parseArgs(rest));
} else {
  console.error('Befehl fehlt. Nutzung:');
  console.error('  node scripts/license/generate-license.mjs keygen');
  console.error('  node scripts/license/generate-license.mjs sign --name "KiGa Mitte" [--date YYYY-MM-DD] [--out datei.lic]');
  process.exit(1);
}
