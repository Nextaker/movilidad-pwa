// js/services/supabaseClient.js
// Importamos el cliente de Supabase desde un CDN confiable y moderno (ESM)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);