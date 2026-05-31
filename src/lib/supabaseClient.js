const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SESSION_STORAGE_KEY = 'reb-auth-session';
const listeners = new Set();

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

const authOptions = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
};

function authHeaders() {
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
  };
}

function normalizeSession(data) {
  if (!data?.access_token) return null;
  const expiresAt = data.expires_at
    ? Number(data.expires_at)
    : Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600);

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
    token_type: data.token_type || 'bearer',
    user: data.user ?? null,
  };
}

function readStoredSession() {
  if (!authOptions.persistSession) return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session) {
  if (!authOptions.persistSession) return;
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function notifyAuthChange(event, session) {
  listeners.forEach((callback) => callback(event, session));
}

async function parseSessionFromUrl() {
  if (!authOptions.detectSessionInUrl) return null;

  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const accessToken = params.get('access_token');
  if (!accessToken) return null;

  const session = normalizeSession({
    access_token: accessToken,
    refresh_token: params.get('refresh_token'),
    expires_at: params.get('expires_at'),
    expires_in: params.get('expires_in'),
    token_type: params.get('token_type'),
  });

  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  writeStoredSession(session);
  return session;
}

async function refreshSession(refreshToken) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.access_token) {
    writeStoredSession(null);
    return { data: { session: null }, error: new Error(data?.message || '登入狀態已失效，請重新登入。') };
  }

  const session = normalizeSession(data);
  writeStoredSession(session);
  notifyAuthChange('TOKEN_REFRESHED', session);
  return { data: { session }, error: null };
}

async function getSession() {
  if (!hasSupabaseConfig) return { data: { session: null }, error: null };

  const urlSession = await parseSessionFromUrl();
  if (urlSession) return { data: { session: urlSession }, error: null };

  const session = readStoredSession();
  if (!session?.access_token) return { data: { session: null }, error: null };

  const expiresSoon = session.expires_at && session.expires_at - 60 < Math.floor(Date.now() / 1000);
  if (expiresSoon && authOptions.autoRefreshToken) {
    return session.refresh_token
      ? refreshSession(session.refresh_token)
      : { data: { session: null }, error: new Error('登入狀態已失效，請重新登入。') };
  }

  return { data: { session }, error: null };
}

async function signInWithOtp({ email, options = {} }) {
  const response = await fetch(`${supabaseUrl}/auth/v1/otp`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      email,
      create_user: options.shouldCreateUser ?? true,
    }),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return { data: null, error: new Error(data?.msg || data?.message || '驗證碼寄送失敗。') };
  }

  return { data, error: null };
}

async function verifyOtp({ email, token, type }) {
  const response = await fetch(`${supabaseUrl}/auth/v1/verify`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, token, type }),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.access_token) {
    return { data: null, error: new Error(data?.msg || data?.message || '驗證碼錯誤或已過期。') };
  }

  const session = normalizeSession(data);
  writeStoredSession(session);
  notifyAuthChange('SIGNED_IN', session);
  return { data: { session, user: data.user ?? null }, error: null };
}

async function signOut() {
  const { data } = await getSession();
  if (data.session?.access_token) {
    await fetch(`${supabaseUrl}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${data.session.access_token}`,
      },
    }).catch(() => {});
  }

  writeStoredSession(null);
  notifyAuthChange('SIGNED_OUT', null);
  return { error: null };
}

function onAuthStateChange(callback) {
  listeners.add(callback);
  return {
    data: {
      subscription: {
        unsubscribe: () => listeners.delete(callback),
      },
    },
  };
}

export const supabase = {
  auth: {
    options: authOptions,
    getSession,
    onAuthStateChange,
    signInWithOtp,
    verifyOtp,
    signOut,
  },
};
