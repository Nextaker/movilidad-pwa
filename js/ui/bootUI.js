// js/ui/bootUI.js - Pantalla de Arranque Estilo Videojuego
import { authService } from '../services/authService.js';

export const bootUI = {
    init() {
        const bootScreen = document.getElementById('boot-screen');
        const bootFill = document.getElementById('boot-fill');
        const bootStatusMsg = document.getElementById('boot-status-msg');
        const btnBootEnter = document.getElementById('btn-boot-enter');

        if (!bootScreen) return;

        let progress = 0;

        // Simular secuencia de carga cyberpunk
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 20) + 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                if (bootStatusMsg) bootStatusMsg.textContent = "SISTEMA LISTO PARA INICIALIZAR";
                if (bootFill) bootFill.style.width = '100%';
                if (btnBootEnter) btnBootEnter.style.display = 'block';
            } else {
                if (bootFill) bootFill.style.width = `${progress}%`;
                if (progress > 60 && bootStatusMsg) bootStatusMsg.textContent = "ESTABLECIENDO ENLACE CON SUPABASE...";
            }
        }, 250);

        // Al hacer clic en el botón de entrada
        if (btnBootEnter) {
            btnBootEnter.addEventListener('click', async () => {
                btnBootEnter.disabled = true;
                if (bootStatusMsg) bootStatusMsg.textContent = "AUTOLOGUEO DE PILOTO EN PROCESO...";

                // Intentar verificar sesión existente en segundo plano de forma silenciosa
                try {
                    await authService.getSession();
                } catch (e) {
                    console.log("Modo invitado activo.");
                }

                // Desvanecer pantalla de arranque
                bootScreen.style.opacity = '0';
                bootScreen.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    bootScreen.style.display = 'none';
                }, 600);
            });
        }
    }
};