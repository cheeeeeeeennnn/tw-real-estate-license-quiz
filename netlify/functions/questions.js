import fs from 'node:fs/promises';
import path from 'node:path';
import { ok, requireAllowedUser, serverError } from './_shared/auth.js';

export async function handler(event) {
  const auth = await requireAllowedUser(event);
  if (auth.error) return auth.error;

  try {
    const filePath = path.resolve(process.cwd(), 'src/data/questions.json');
    const raw = await fs.readFile(filePath, 'utf8');
    return ok(JSON.parse(raw));
  } catch (error) {
    return serverError(error);
  }
}
