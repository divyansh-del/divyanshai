
import { createClient } from '@supabase/supabase-js';

// INSTRUCTIONS:
// 1. Go to https://supabase.com/dashboard/
// 2. Create a new project "ChatBharat"
// 3. Go to Settings > API
// 4. Copy "Project URL" and "anon" public key and paste below

// Fix for Vite: Use import.meta.env or fallback directly. 'process.env' crashes in browser if not polyfilled.
// UPDATED CREDENTIALS PROVIDED BY USER
const SUPABASE_URL = ((import.meta as any).env && (import.meta as any).env.VITE_SUPABASE_URL) || 'https://gursxqfclbvijwjiypbm.supabase.co'; 
const SUPABASE_ANON_KEY = ((import.meta as any).env && (import.meta as any).env.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1cnN4cWZjbGJ2aWp3aml5cGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTg4MzcsImV4cCI6MjA4MDA5NDgzN30.3dCDk4xIcrTbV-xMUlHI12RXkP0c03Rnxg-KniquSbc';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

export const isSupabaseConnected = () => !!supabase;