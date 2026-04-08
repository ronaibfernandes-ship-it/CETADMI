import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const missingConfigMessage = 'Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
export const supabaseConfigError = isSupabaseConfigured ? null : missingConfigMessage

if (!isSupabaseConfigured) {
  console.warn(missingConfigMessage)
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
