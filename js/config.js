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

export const CAR_CATALOG = {
    'fiat_palio': {  
        name: 'Fiat Palio 1.8',  
        images: {
            'rojo': 'assets/garajes/garaje_palio_rojo.jpg',
            'negro': 'assets/garajes/garaje_palio_negro.jpg',
            'gris': 'assets/garajes/garaje_palio_gris.jpg'
        }
    },  
    'chevrolet_aveo': {  
        name: 'Chevrolet Aveo Speed',  
        images: {
            'rojo': 'assets/garajes/garaje_aveo_rojo.jpg',
            'negro': 'assets/garajes/garaje_aveo_negro.jpg',
            'gris': 'assets/garajes/garaje_aveo_gris.jpg'
        }  
    },  
    'toyota_corolla': {  
        name: 'Toyota Corolla',  
        images: {
            'rojo': 'assets/garajes/garaje_corolla_rojo.jpg',
            'negro': 'assets/garajes/garaje_corolla_negro.jpg',
            'gris': 'assets/garajes/garaje_corolla_gris.jpg'
        }  
    },  
    'chevrolet_optra': {  
        name: 'Chevrolet Optra Limited',  
        images: {
            'rojo': 'assets/garajes/garaje_optra_rojo.jpg',
            'negro': 'assets/garajes/garaje_optra_negro.jpg',
            'gris': 'assets/garajes/garaje_optra_gris.jpg'
        }  
    }  
};