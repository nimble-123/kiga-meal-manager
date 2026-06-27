import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { verifyToken, verifyTokenWithKey, deriveKey } from '../../electron/licenseCrypto.js';
import { PUBLIC_KEY_PEM } from '../../electron/licenseKey.js';

// Eigenes Ephemeral-Keypair: Tests sind CI-sicher und unabhängig vom geheimen,
// gitignored Produktiv-Private-Key.
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const PUB_PEM = publicKey.export({ type: 'spki', format: 'pem' });

function makeToken(payload, key = privateKey) {
  const payloadBuf = Buffer.from(JSON.stringify(payload), 'utf8');
  const sig = crypto.sign(null, payloadBuf, key);
  return `${payloadBuf.toString('base64url')}.${sig.toString('base64url')}`;
}

describe('verifyTokenWithKey', () => {
  it('akzeptiert einen korrekt signierten Token und gibt das Payload zurück', () => {
    const token = makeToken({ name: 'KiGa Mitte', iat: '2026-06-27' });
    expect(verifyTokenWithKey(token, PUB_PEM)).toEqual({ name: 'KiGa Mitte', iat: '2026-06-27' });
  });

  it('lehnt einen Token mit manipulierter Signatur ab', () => {
    const token = makeToken({ name: 'KiGa Mitte' });
    const [p, s] = token.split('.');
    const flipped = s[0] === 'A' ? 'B' + s.slice(1) : 'A' + s.slice(1);
    expect(verifyTokenWithKey(`${p}.${flipped}`, PUB_PEM)).toBeNull();
  });

  it('lehnt einen Token mit ausgetauschtem Payload ab (Signatur passt nicht mehr)', () => {
    const token = makeToken({ name: 'KiGa Mitte', iat: '2026-01-01' });
    const [, s] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ name: 'Fremder KiGa' })).toString('base64url');
    expect(verifyTokenWithKey(`${forged}.${s}`, PUB_PEM)).toBeNull();
  });

  it('lehnt einen mit fremdem Schlüssel signierten Token ab', () => {
    const other = crypto.generateKeyPairSync('ed25519');
    const token = makeToken({ name: 'KiGa Mitte' }, other.privateKey);
    expect(verifyTokenWithKey(token, PUB_PEM)).toBeNull();
  });

  it('lehnt einen Token ohne name im Payload ab', () => {
    const token = makeToken({ iat: '2026-06-27' });
    expect(verifyTokenWithKey(token, PUB_PEM)).toBeNull();
  });

  it.each([
    ['leerer String', ''],
    ['nur ein Teil', 'abcdef'],
    ['Müll', 'not-a-valid-token!!'],
    ['null', null],
    ['undefined', undefined],
    ['leerer Payload-Teil', '.abc'],
  ])('lehnt fehlerhafte Eingabe ab: %s', (_label, bad) => {
    expect(verifyTokenWithKey(bad, PUB_PEM)).toBeNull();
  });
});

describe('verifyToken (eingebetteter Public Key)', () => {
  it('der eingebettete Public Key ist ein gültiger Ed25519-Schlüssel', () => {
    const key = crypto.createPublicKey(PUBLIC_KEY_PEM);
    expect(key.asymmetricKeyType).toBe('ed25519');
  });

  it('lehnt Müll ab, ohne zu werfen', () => {
    expect(verifyToken('garbage')).toBeNull();
    expect(verifyToken('')).toBeNull();
  });
});

describe('deriveKey', () => {
  it('ist deterministisch und liefert 64 Hex-Zeichen (256 bit)', () => {
    expect(deriveKey('token-abc')).toBe(deriveKey('token-abc'));
    expect(deriveKey('token-abc')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('liefert für unterschiedliche Token unterschiedliche Keys', () => {
    expect(deriveKey('token-abc')).not.toBe(deriveKey('token-xyz'));
  });

  it('ignoriert umschließende Leerzeichen', () => {
    expect(deriveKey('  token-abc  ')).toBe(deriveKey('token-abc'));
  });
});
