// js/services/vehicleService.js
import { supabase } from './supabaseClient.js';

export const vehicleService = {
    // 1. Obtener la ficha del vehículo del usuario actual
    async getActiveVehicleData() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                return getFallbackVehicleData(); // Modo invitado
            }

            const userId = session.user.id;

            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error || !data) {
                console.warn('No se encontró vehículo en Supabase, usando respaldo:', error?.message);
                return getFallbackVehicleData();
            }

            return data;
        } catch (err) {
            console.error('Error al conectar con Supabase:', err);
            return getFallbackVehicleData();
        }
    },

    // 2. Guardar o actualizar la ficha técnica de forma segura (Evita error 42P10)
    async saveVehicleSpec(specData) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error("Debes iniciar sesión para guardar la ficha.");

        const userId = session.user.id;

        const payload = {
            user_id: userId,
            model_name: specData.modelName,
            engine_type: specData.engineType,
            oil_type: specData.oilType,
            fuel_octane: specData.fuelOctane || '91 Octanos',
            current_mileage: parseInt(specData.currentMileage) || 0,
            next_service_km: parseInt(specData.nextServiceKm) || 0
        };

        // Verificar si ya existe un registro para este usuario
        const { data: existing } = await supabase
            .from('vehicles')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        let result;
        if (existing) {
            // Actualizar si ya existe
            result = await supabase
                .from('vehicles')
                .update(payload)
                .eq('user_id', userId);
        } else {
            // Insertar si es nuevo
            result = await supabase
                .from('vehicles')
                .insert([payload]);
        }

        if (result.error) throw result.error;
        return result.data;
    }
};

// Objeto de respaldo temporal para modo invitado o sin conexión
function getFallbackVehicleData() {
    return {
        model_name: "Fiat Palio 1.8",
        engine_type: "1.8L GM Powertrain",
        oil_type: "15W-40 Multígrado",
        fuel_octane: "91 Octanos",
        current_mileage: 1000,
        next_service_km: 5000
    };
}