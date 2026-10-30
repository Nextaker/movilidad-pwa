// js/services/authService.js - Asegurando metadatos de registro y perfil
import { supabase } from './supabaseClient.js';

export const authService = {
    async login(email, password) {
        return await supabase.auth.signInWithPassword({ email, password });
    },

    async signUp(email, password, pilotName = 'Piloto') {
        return await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { 
                    pilot_name: pilotName,
                    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                }
            }
        });
    },

    async updateProfile(metadata) {
        return await supabase.auth.updateUser({
            data: metadata
        });
    },

    async logout() {
        return await supabase.auth.signOut();
    },

    async getSession() {
        return await supabase.auth.getSession();
    },

    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    }
};