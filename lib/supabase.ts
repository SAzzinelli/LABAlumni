import { createClient } from '@supabase/supabase-js'
import { mockSupabase } from './supabase-mock'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Use mock if Supabase is not configured
const useMock = !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co'

if (useMock && typeof window !== 'undefined') {
  console.log('📦 Using Mock Supabase (localStorage) - Configure Supabase to use real database')
}

export const supabase = useMock 
  ? (mockSupabase as any)
  : createClient(supabaseUrl, supabaseAnonKey)

