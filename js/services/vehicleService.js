// js/services/vehicleService.js
import { supabase } from './supabaseClient.js';

/**
 * Obtiene la información del vehículo activo y su estado de mantenimiento.
 * @param {string} userId - ID del usuario actual.
 */
export async function getActiveVehicleData(userId = 'default_user') {
    try {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (error) {
            console.warn('Usando datos locales de respaldo (Modo Offline/Mock):', error.message);
            // Datos por defecto basados en tu perfil actual mientras conectas la BD
            return getFallbackVehicleData();
        }

        return data;
    } catch (err) {
        console.error('Error de red al conectar con Supabase:', err);
        return getFallbackVehicleData();
    }
}

// Objeto de respaldo temporal para mantener la PWA funcional offline o sin BD configurada
function getFallbackVehicleData() {
    return {
        name: "Jose Nelo",
        car_model: "Fiat Palio 1.8",
        level: "#1 GT",
        mileage: "1,000 km",
        next_service_speed: "37.3 km/h",
        last_check: "Today"
    };
}