import { useState } from 'react';
import { QuestionDataProvider, useQuestionData } from '../context/QuestionDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function LoginScreen() {
  const { authMessage, sendOtp, verifyOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    if (step === 'email') {
      const sent = await sendOtp(email.trim());
      if (sent) setStep('otp');
    } else {
      await verifyOtp(email.trim(), otp.trim());
    }
    setSubmitting(false);
  }

  return (
    <main className="app-shell auth-shell">
      <section className="auth-card">
        <h1>不動產經紀人證照複習</h1>
        <p>請使用已授權的 Email 登入，系統會寄送 Email 驗證碼。</p>
        <form className="auth-form" onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              disabled={step === 'otp'}
              required
            />
          </label>
          {step === 'otp' && (
            <label>
              驗證碼
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="輸入 Email 驗證碼"
                required
              />
            </label>
          )}
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? '處理中' : step === 'email' ? '寄送驗證碼' : '驗證並登入'}
          </button>
          {step === 'otp' && (
            <button className="secondary-button" type="button" onClick={() => setStep('email')} disabled={submitting}>
              重新輸入 Email
            </button>
          )}
        </form>
        {authMessage && <p className="auth-message">{authMessage}</p>}
      </section>
    </main>
  );
}

function SetupScreen() {
  return (
    <main className="app-shell auth-shell">
      <section className="auth-card">
        <h1>尚未設定登入</h1>
        <p>請先設定 Supabase 與 Netlify 環境變數，正式分享版才會開放登入。</p>
      </section>
    </main>
  );
}

function LoadingScreen({ message = '載入中' }) {
  return (
    <main className="app-shell auth-shell">
      <section className="auth-card">
        <h1>{message}</h1>
        <p>請稍候。</p>
      </section>
    </main>
  );
}

function DataGate({ children }) {
  const { error, loading } = useQuestionData();

  if (loading) return <LoadingScreen message="題庫載入中" />;

  if (error) {
    return (
      <main className="app-shell auth-shell">
        <section className="auth-card">
          <h1>{error.status === 403 ? '沒有存取權' : '題庫載入失敗'}</h1>
          <p>{error.message}</p>
        </section>
      </main>
    );
  }

  return children;
}

export default function AuthGate({ children }) {
  const { hasSupabaseConfig, loading, session } = useAuth();

  if (!hasSupabaseConfig) return <SetupScreen />;
  if (loading) return <LoadingScreen />;
  if (!session) return <LoginScreen />;

  return (
    <QuestionDataProvider>
      <DataGate>{children}</DataGate>
    </QuestionDataProvider>
  );
}
