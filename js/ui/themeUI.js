// js/ui/themeUI.js - Gestor de Temas
import { storageService } from '../services/storageService.js';

export const themeUI = {
    init() {
        const savedTheme = storageService.getTheme();
        this.applyTheme(savedTheme);

        // Exponer al window para botones con onclick
        window.cambiarTemaGlobal = (themeName) => {
            storageService.setTheme(themeName);
            this.applyTheme(themeName);
        };
    },

    applyTheme(theme) {
        document.body.classList.remove('theme-cyan', 'theme-purple', 'theme-gold', 'theme-emerald');
        document.body.classList.add(`theme-${theme}`);
    }
};