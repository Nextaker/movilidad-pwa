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
        let currentUser = null;

        const setMessage = (msg, isError = false) => {
            if (!status) return;
            status.textContent = msg;
            status.style.color = isError ? '#ff0055' : 'var(--hud-primary)';
        };

        const setUser = (user) => {
            currentUser = user;
            if (userLabel) {
                userLabel.textContent = user?.user_metadata?.pilot_name || user?.email || 'Invitado';
            }
            if (hudAvatarImg) {
                hudAvatarImg.src = user?.user_metadata?.avatar_url || './assets/componentes/7a5e6.svg';
            }
            const openButtonLabel = openButton.querySelector('span');
            if (openButtonLabel) openButtonLabel.textContent = user ? 'PERFIL' : 'ACCEDER';
            if (logoutButton) logoutButton.hidden = !user;
        };

        const setMode = (registerMode) => {
            isRegisterMode = registerMode;
            if (tabLogin) {
                tabLogin.classList.toggle('active', !registerMode);
                tabLogin.setAttribute('aria-selected', String(!registerMode));
            }
            if (tabRegister) {
                tabRegister.classList.toggle('active', registerMode);
                tabRegister.setAttribute('aria-selected', String(registerMode));
            }
            if (groupPilotName) groupPilotName.hidden = !registerMode;
            if (submitButton) submitButton.textContent = registerMode ? 'REGISTRAR PILOTO ➔' : 'INICIALIZAR SISTEMA ➔';
            setMessage('');
        };

        if (tabLogin) tabLogin.addEventListener('click', () => setMode(false));
        if (tabRegister) tabRegister.addEventListener('click', () => setMode(true));

        if (openButton) {
            openButton.addEventListener('click', () => {
                if (currentUser) {
                    document.dispatchEvent(new CustomEvent('overdrive:open-profile'));
                    return;
                }
                setMessage('');
                modal.style.display = 'flex';
            });
        }

        document.addEventListener('overdrive:open-auth', () => {
            setMessage('');
            modal.style.display = 'flex';
        });

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
            if (submitButton) submitButton.disabled = true;
            setMessage('CONECTANDO CON LA RED...');

            try {
                const email = emailInput?.value.trim();
                const password = passwordInput?.value;
                const pilotName = pilotNameInput ? pilotNameInput.value.trim() : '';
                if (!email || !password) {
                    throw new Error('Completa el correo y la contraseña.');
                }

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
                setMessage(err.message || 'ERROR DEL SISTEMA: SIN CONEXIÓN.', true);
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        });

        if (logoutButton) {
            logoutButton.addEventListener('click', async () => {
                logoutButton.disabled = true;
                try {
                    const { error } = await authService.logout();
                    if (error) throw error;
                    setUser(null);
                } catch (err) {
                    console.error('Error al cerrar sesión:', err);
                    setMessage(err.message || 'No se pudo cerrar la sesión.', true);
                    modal.style.display = 'flex';
                } finally {
                    logoutButton.disabled = false;
                }
            });
        }

        // Escuchar Estado en Tiempo Real
        authService.onAuthStateChange((_event, session) => setUser(session?.user ?? null));

        // Cargar sesión inicial
        authService.getSession()
            .then(({ data, error }) => {
                if (error) throw error;
                setUser(data?.session?.user ?? null);
            })
            .catch((err) => {
                console.error('Error al recuperar la sesión:', err);
                setMessage(err.message || 'No se pudo recuperar la sesión.', true);
            });

        setMode(false);
    }
};