import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://tjswlduwnrrudlrnqvfs.supabase.co'

export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'supabase-anon-key-placeholder'

export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  'supabase-service-key-placeholder'

// Standard client for public / browser queries with RLS
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Administrative / Backend client with service role for secured API routes
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})
