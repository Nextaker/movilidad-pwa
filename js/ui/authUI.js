// js/ui/authUI.js - Controlador de Interfaz de Autenticación
import { authService } from '../services/authService.js';

export const authUI = {
    init() {
        const modal = document.getElementById('auth-modal');
        const openButton = document.getElementById('btn-auth-open');
        const closeButton = document.getElementById('btn-auth-close');
        const logoutButton = document.getElementById('btn-auth-logout');
        const form = document.getElementById('auth-form');
        const emailInput = document.getElementById('auth-email');
        const passwordInput = document.getElementById('auth-password');
        const pilotNameInput = document.getElementById('auth-pilot-name');
        const groupPilotName = document.getElementById('group-pilot-name');
        const submitButton = document.getElementById('auth-submit');
        const tabLogin = document.getElementById('tab-login');
        const tabRegister = document.getElementById('tab-register');
        const status = document.getElementById('auth-status');
        const userLabel = document.getElementById('auth-user-label');
        const hudAvatarImg = document.getElementById('hud-avatar-img');

        if (!modal || !openButton || !form) return;

        let isRegisterMode = false;

        const setMessage = (msg, isError = false) => {
            if (!status) return;
            status.textContent = msg;
            status.style.color = isError ? '#ff0055' : 'var(--hud-primary)';
        };

        const setUser = (user) => {
            if (userLabel) {
                userLabel.textContent = user?.user_metadata?.pilot_name || user?.email || 'Invitado';
            }
            if (hudAvatarImg && user?.user_metadata?.avatar_url) {
                hudAvatarImg.src = user.user_metadata.avatar_url;
            }
            if (openButton) openButton.style.display = user ? 'none' : 'inline-flex';
            if (logoutButton) logoutButton.style.display = user ? 'inline-flex' : 'none';
        };

        const setMode = (registerMode) => {
            isRegisterMode = registerMode;
            if (tabLogin) tabLogin.classList.toggle('active', !registerMode);
            if (tabRegister) tabRegister.classList.toggle('active', registerMode);
            if (groupPilotName) groupPilotName.style.display = registerMode ? 'block' : 'none';
            if (submitButton) submitButton.textContent = registerMode ? 'REGISTRAR PILOTO ➔' : 'INICIALIZAR SISTEMA ➔';
            setMessage('');
        };

        if (tabLogin) tabLogin.addEventListener('click', () => setMode(false));
        if (tabRegister) tabRegister.addEventListener('click', () => setMode(true));

        if (openButton) {
            openButton.addEventListener('click', () => {
                setMessage('');
                modal.style.display = 'flex';
            });
        }

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitButton.disabled = true;
            setMessage('CONECTANDO CON LA RED...');

            try {
                const email = emailInput.value.trim();
                const password = passwordInput.value;
                const pilotName = pilotNameInput ? pilotNameInput.value.trim() : '';

                const { data, error } = isRegisterMode
                    ? await authService.signUp(email, password, pilotName)
                    : await authService.login(email, password);

                if (error) {
                    setMessage(error.message, true);
                } else if (isRegisterMode && !data.session) {
                    setMessage('¡PERFIL CREADO! REVISA TU CORREO PARA CONFIRMAR.');
                    form.reset();
                } else {
                    setMessage('AUTENTICACIÓN EXITOSA.');
                    setTimeout(() => {
                        modal.style.display = 'none';
                        form.reset();
                    }, 500);
                }
            } catch (err) {
                console.error(err);
                setMessage('ERROR DEL SISTEMA: SIN CONEXIÓN.', true);
            } finally {
                submitButton.disabled = false;
            }
        });

        if (logoutButton) {
            logoutButton.addEventListener('click', async () => {
                await authService.logout();
                setUser(null);
            });
        }

        // Escuchar Estado en Tiempo Real
        authService.onAuthStateChange((_event, session) => setUser(session?.user ?? null));

        // Cargar sesión inicial
        authService.getSession().then(({ data }) => {
            setUser(data?.session?.user ?? null);
        });

        setMode(false);
    }
};