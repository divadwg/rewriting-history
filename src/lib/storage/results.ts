import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

const RESULTS_DIR = join(process.cwd(), '.data', 'results');

function ensureDir() {
  if (!existsSync(RESULTS_DIR)) {
    mkdirSync(RESULTS_DIR, { recursive: true });
  }
}

function generateId(): string {
  return randomBytes(6).toString('base64url');
}

export interface StoredResult {
  id: string;
  type: 'live' | 'challenge';
  title: string;
  createdAt: string;
  data: Record<string, unknown>;
}

export function saveResult(type: 'live' | 'challenge', title: string, data: Record<string, unknown>): StoredResult {
  ensureDir();
  const id = generateId();
  const result: StoredResult = {
    id,
    type,
    title,
    createdAt: new Date().toISOString(),
    data,
  };
  writeFileSync(join(RESULTS_DIR, `${id}.json`), JSON.stringify(result), 'utf8');
  return result;
}

export function getResult(id: string): StoredResult | null {
  ensureDir();
  const filePath = join(RESULTS_DIR, `${id}.json`);
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as StoredResult;
  } catch {
    return null;
  }
}

export function listResults(): StoredResult[] {
  ensureDir();
  const files = readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json'));
  return files
    .map(f => {
      try {
        return JSON.parse(readFileSync(join(RESULTS_DIR, f), 'utf8')) as StoredResult;
      } catch {
        return null;
      }
    })
    .filter((r): r is StoredResult => r !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
