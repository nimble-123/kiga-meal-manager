import { useState } from 'react';
import { sendEmail } from '../utils/email';
import { track } from '../utils/telemetry';

const FEEDBACK_TO = 'info@nilslutz.de';
const CATEGORIES = [
  { value: 'bug', label: 'Fehler / Bug' },
  { value: 'feature', label: 'Feature-Wunsch' },
  { value: 'general', label: 'Allgemeines Feedback' },
];

const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '?';

// Feedback/Feature-Wunsch per vorausgefüllter E-Mail an den Entwickler.
export default function FeedbackDialog({ onClose }) {
  const [category, setCategory] = useState('feature');
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState('');

  const handleSend = () => {
    const msg = message.trim();
    if (!msg) return;
    const catLabel = CATEGORIES.find((c) => c.value === category)?.label || category;
    const subject = `KiGa Essenverwaltung – Feedback (${catLabel}) v${APP_VERSION}`;
    const body =
      `Kategorie: ${catLabel}\n` +
      `App-Version: ${APP_VERSION}\n` +
      `System: ${navigator.userAgent}\n` +
      (replyTo.trim() ? `Antwort an: ${replyTo.trim()}\n` : '') +
      `\nNachricht:\n${msg}\n`;
    sendEmail(subject, body, FEEDBACK_TO);
    track('feedback_submitted', { category });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card fade-in" style={{ padding: 28, maxWidth: 480, width: '90%' }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{'💬'} Feedback / Feature-Wunsch</div>
        <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 16 }}>
          Ihr Feedback geht per E-Mail an den Entwickler. Es öffnet sich Ihr Mailprogramm mit einer vorausgefüllten Nachricht – bitte zum Abschluss dort auf „Senden“ klicken.
        </div>

        <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Kategorie</label>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', marginBottom: 12 }}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Nachricht</label>
        <textarea
          className="input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Was möchten Sie uns mitteilen?"
          rows={5}
          style={{ width: '100%', resize: 'vertical', marginBottom: 12 }}
        />

        <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Antwort-E-Mail (optional)</label>
        <input
          className="input"
          type="email"
          value={replyTo}
          onChange={(e) => setReplyTo(e.target.value)}
          placeholder="ihre@email.de"
          style={{ width: '100%', marginBottom: 20 }}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={handleSend} disabled={!message.trim()}>E-Mail erstellen</button>
        </div>
      </div>
    </div>
  );
}
