import { useState } from 'react';
import { MailWarning, X, RefreshCw } from 'lucide-react';
import { apiFetch } from '../api';

export default function UnconfirmedEmailBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState(false);

  if (dismissed) return null;

  async function handleResend() {
    setSending(true);
    await apiFetch('/api/auth/resend-confirmation', { method: 'POST' });
    setSending(false);
    setSent(true);
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3 mb-6">
      <MailWarning size={18} className="text-amber-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        {sent ? (
          <p className="text-sm text-amber-800 font-medium">
            Confirmation email sent! Check your inbox.
          </p>
        ) : (
          <>
            <p className="text-sm text-amber-800 font-medium">
              Please confirm your email address to receive donation receipts.
            </p>
            <button onClick={handleResend} disabled={sending}
              className="text-xs text-amber-700 font-semibold hover:underline flex items-center gap-1 mt-0.5 disabled:opacity-60">
              <RefreshCw size={11} />
              {sending ? 'Sending…' : 'Resend confirmation email'}
            </button>
          </>
        )}
      </div>
      <button onClick={() => setDismissed(true)}
        className="text-amber-400 hover:text-amber-600 flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}