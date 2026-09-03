import { createClient } from '@supabase/supabase-js'

// Supabase renombró la "anon key" a "Publishable key" en su nuevo sistema de
// API keys. Es el mismo tipo de clave pública (segura para el frontend); RLS
// sigue siendo lo que protege los datos.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Faltan variables de entorno de Supabase. Definí VITE_SUPABASE_URL y ' +
      'VITE_SUPABASE_PUBLISHABLE_KEY en tu archivo .env (ver .env.example).',
  )
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
