// js/ui/themeUI.js - Gestor de Temas
import { storageService } from '../services/storageService.js';

export const themeUI = {
    init() {
        const savedTheme = storageService.getTheme() || 'cyan';
        this.applyTheme(savedTheme);
    },

    applyTheme(theme) {
        if (!theme) theme = 'cyan';
        // Remover cualquier clase de tema previa de manera segura
        document.body.classList.remove('theme-cyan', 'theme-purple', 'theme-gold', 'theme-emerald');
        document.body.classList.add(`theme-${theme}`);
    }
};