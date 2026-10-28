import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const {
  VITE_SUPABASE_URL: url,
  VITE_SUPABASE_ANON_KEY: anonKey,
  VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
} = import.meta.env;
const key = anonKey || publishableKey;

if (!url) {
  throw new Error('Thiếu biến VITE_SUPABASE_URL. Hãy thêm biến này vào file .env.local.');
}

if (!key) {
  throw new Error(
    'Thiếu biến VITE_SUPABASE_ANON_KEY hoặc VITE_SUPABASE_PUBLISHABLE_KEY. Hãy thêm một trong hai vào file .env.local.',
  );
}

export const supabase = createClient<Database>(url, key);
