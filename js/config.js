// js/config.js - Configuración Central de Overdrive
export const SUPABASE_URL = 'https://nzbblvezhwgeafesqtby.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_Qo4XHC7A9AvXYdCj9QYw7A_rM7EeP5o';

export const CONFIG = {
    DEFAULT_COORDS: [11.7167, -70.1333], // Punto Fijo, Venezuela
    DEFAULT_ZOOM: 13,
    THEMES: ['cyan', 'purple', 'gold', 'emerald'],
    MAP_ENGINES: {
        VECTOR: 'leaflet_vec',
        SATELLITE: 'leaflet_sat'
    }
};

export const DEFAULT_CAR_KEY = 'fiat_palio';
export const DEFAULT_PAINT_KEY = 'obsidian';
export const CAR_PAINTS = ['obsidian', 'crimson', 'titanium'];

export const CAR_CATALOG = {
    fiat_palio: {
        name: 'Fiat Palio 1.8',
        image: './assets/garajes/garaje_palio_negro.webp'
    },
    chevrolet_aveo: {
        name: 'Chevrolet Aveo',
        image: './assets/garajes/garaje_aveo.webp'
    },
    toyota_corolla: {
        name: 'Toyota Corolla',
        image: './assets/garajes/garaje_corolla.webp'
    }
};