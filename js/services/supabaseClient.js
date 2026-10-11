// js/services/supabaseClient.js
// Importamos el cliente de Supabase desde un CDN confiable y moderno (ESM)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ¡IMPORTANTE!: Reemplaza estas credenciales con las de tu proyecto en Supabase
const SUPABASE_URL = 'https://nzbblvezhwgeafesqtby.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Qo4XHC7A9AvXYdCj9QYw7A_rM7EeP5o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);