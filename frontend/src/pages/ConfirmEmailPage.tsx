import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import AnchorLogo from '../components/AnchorLogo';
import { apiFetch } from '../api';

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const email = searchParams.get('email') ?? '';
  const token = searchParams.get('token') ?? '';

  useEffect(() => {
    if (!email || !token) {
      setStatus('error');
      setMessage('Invalid confirmation link.');
      return;
    }

    apiFetch('/api/auth/confirm-email', {
      method: 'POST',
      body: JSON.stringify({ email, token }),
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus('success');
          setMessage(data.message ?? 'Email confirmed successfully!');
        } else {
          setStatus('error');
          setMessage(data.message ?? 'Invalid or expired confirmation link.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Could not reach the server. Please try again.');
      });
  }, [email, token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-light to-teal-dark flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full animate-fade-in text-center">
        <div className="flex justify-center mb-6">
          <AnchorLogo size="lg" variant="dark" />
        </div>

        {status === 'loading' && (
          <>
            <Loader size={48} className="text-teal mx-auto mb-4 animate-spin" />
            <h2 className="font-display text-xl font-bold text-navy mb-2">Confirming your email…</h2>
            <p className="text-dark/50 text-sm">Just a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-navy mb-2">Email Confirmed!</h2>
            <p className="text-dark/50 text-sm mb-6">{message}</p>
            <Link to="/donor" className="btn-primary text-sm inline-flex items-center gap-2">
              Go to Donor Portal
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-navy mb-2">Confirmation Failed</h2>
            <p className="text-dark/50 text-sm mb-6">{message}</p>
            <Link to="/donor" className="btn-primary text-sm inline-flex items-center gap-2">
              Back to Donor Portal
            </Link>
          </>
        )}
      </div>
    </div>
  );
}