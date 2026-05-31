function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-cache',
    },
    body: JSON.stringify(payload),
  };
}

function getBearerToken(event) {
  const header = event.headers.authorization || event.headers.Authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? '';
}

function getAllowedEmails() {
  return (process.env.ALLOWED_USER_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAllowedUser(event) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = getBearerToken(event);
  const allowedEmails = getAllowedEmails();

  if (!token) {
    return { error: jsonResponse(401, { message: '請先登入。' }) };
  }

  if (!supabaseUrl || !serviceRoleKey || !allowedEmails.length) {
    return {
      error: jsonResponse(500, {
        message: '存取控制尚未完成設定，請確認 Netlify 環境變數。',
      }),
    };
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${token}`,
    },
  });
  const user = await response.json().catch(() => null);

  if (!response.ok || !user?.email) {
    return { error: jsonResponse(401, { message: '登入狀態已失效，請重新登入。' }) };
  }

  const email = user.email.toLowerCase();
  if (!allowedEmails.includes(email)) {
    return { error: jsonResponse(403, { message: '這個帳號沒有此 App 的存取權。' }) };
  }

  return { user };
}

export function ok(payload) {
  return jsonResponse(200, payload);
}

export function serverError(error) {
  return jsonResponse(500, {
    message: '題庫資料讀取失敗。',
    detail: error instanceof Error ? error.message : String(error),
  });
}
