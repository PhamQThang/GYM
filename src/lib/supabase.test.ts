import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Supabase client environment', () => {
  it('throws when VITE_SUPABASE_URL is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
    vi.resetModules();

    await expect(import('./supabase')).rejects.toThrow('VITE_SUPABASE_URL');
  });

  it('throws when VITE_SUPABASE_ANON_KEY is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    vi.resetModules();

    await expect(import('./supabase')).rejects.toThrow('VITE_SUPABASE_ANON_KEY');
  });

  it('accepts the Supabase publishable key name', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-publishable-key');
    vi.resetModules();

    await expect(import('./supabase')).resolves.toHaveProperty('supabase');
  });
});
