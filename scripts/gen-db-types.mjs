import { exec } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

function readProjectIdFromEnvFile() {
  const envPath = path.join(projectRoot, '.env.local');
  if (!existsSync(envPath)) return '';

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (
      separator < 0 ||
      trimmed.slice(0, separator).trim() !== 'SUPABASE_PROJECT_ID'
    ) {
      continue;
    }

    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value;
  }

  return '';
}

const projectId =
  process.env.SUPABASE_PROJECT_ID?.trim() || readProjectIdFromEnvFile();
if (!projectId) {
  console.error(
    'Thiếu SUPABASE_PROJECT_ID. Hãy khai báo biến môi trường hoặc thêm vào .env.local.'
  );
  process.exit(1);
}

if (!/^[\w-]+$/.test(projectId)) {
  console.error('SUPABASE_PROJECT_ID không hợp lệ.');
  process.exit(1);
}

const command = `npx supabase gen types typescript --project-id "${projectId}"`;
exec(
  command,
  {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    shell: true
  },
  (error, stdout, stderr) => {
    if (error) {
      if (stderr.trim()) console.error(stderr.trim());
      else console.error(error.message);
      console.error('Chạy npx supabase login trước, rồi thử lại.');
      process.exitCode = 1;
      return;
    }

    writeFileSync(
      path.join(projectRoot, 'src/lib/database.types.ts'),
      stdout,
      'utf8'
    );
  }
);
