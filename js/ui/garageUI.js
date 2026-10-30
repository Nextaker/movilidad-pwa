// js/ui/garageUI.js - Control de Modales y Comportamiento Inteligente de Tarjetas 3D
import { vehicleService } from '../services/vehicleService.js';
import { storageService } from '../services/storageService.js';
import { authService } from '../services/authService.js';

export const garageUI = {
    init() {
        // --- 1. REFERENCIAS AL DOM ---
        const subcardProfiles = document.getElementById('subcard-profiles');
        const subcardVehicle = document.getElementById('subcard-vehicle');
        const subcardGarageConfig = document.getElementById('subcard-garage-config');

        // Modal 1: Perfil
        const modalProfile = document.getElementById('modal-pilot-profile');
        const btnCloseProfile = document.getElementById('btn-close-profile-modal');
        const btnSaveProfile = document.getElementById('btn-save-pilot-profile');
        const profilePilotName = document.getElementById('profile-pilot-name');
        const profileEmail = document.getElementById('profile-email');
        const profileAvatarUrl = document.getElementById('profile-avatar-url');
        const hudAvatarImg = document.getElementById('hud-avatar-img');

        // Modal 2: Vehículo (Telemetría)
        const modalVehicle = document.getElementById('modal-vehicle-spec');
        const btnCloseVehicle = document.getElementById('btn-close-vehicle-modal');
        const btnSaveVehicle = document.getElementById('btn-save-vehicle-spec');
        const specCarModel = document.getElementById('spec-car-model');
        const specEngineType = document.getElementById('spec-engine-type');
        const specOilType = document.getElementById('spec-oil-type');
        const specMileage = document.getElementById('spec-mileage');
        const specNextService = document.getElementById('spec-next-service');
        const statusMsg = document.getElementById('vehicle-spec-status');

        // Modal 3: Configuración de Garaje & Estética
        const modalGarageConfig = document.getElementById('modal-garage-config');
        const btnCloseGarageConfig = document.getElementById('btn-close-garage-config');
        const btnSaveGarageConfig = document.getElementById('btn-save-garage-config');
        const selectGarageCarModel = document.getElementById('select-garage-car-model');
        const selectThemeMode = document.getElementById('select-theme-mode');

        // --- 2. LÓGICA INTELIGENTE DE CLIC EN TARJETAS (Evita apertura accidental) ---
        const handleCardInteraction = (cardElement, openModalCallback) => {
            if (!cardElement) return;
            cardElement.addEventListener('click', (e) => {
                // Si la tarjeta ya está activa (en el centro), abre el modal
                if (cardElement.classList.contains('active')) {
                    openModalCallback();
                } else {
                    // Si no está activa, delegamos el evento al carrusel para que la centre
                    // (Asumiendo que tu módulo de carrusel maneja la selección por índice o clases)
                    const index = cardElement.getAttribute('data-index');
                    if (window.selectCarouselCard && index !== null) {
                        window.selectCarouselCard(parseInt(index));
                    }
                }
            });
        };

        handleCardInteraction(subcardProfiles, () => this.openProfileModal());
        handleCardInteraction(subcardVehicle, () => this.openVehicleModal());
        handleCardInteraction(subcardGarageConfig, () => this.openSettingsModal());

        // --- 3. CIERRE DE MODALES ---
        if (btnCloseProfile) btnCloseProfile.addEventListener('click', () => modalProfile.style.display = 'none');
        if (btnCloseVehicle) btnCloseVehicle.addEventListener('click', () => modalVehicle.style.display = 'none');
        if (btnCloseGarageConfig) btnCloseGarageConfig.addEventListener('click', () => modalGarageConfig.style.display = 'none');

        [modalProfile, modalVehicle, modalGarageConfig].forEach(m => {
            if (m) {
                m.addEventListener('click', (e) => {
                    if (e.target === m) m.style.display = 'none';
                });
            }
        });

        // --- 4. SELECCIÓN DE AVATAR PRESET ---
        document.querySelectorAll('.avatar-option').forEach(img => {
            img.addEventListener('click', (e) => {
                document.querySelectorAll('.avatar-option').forEach(i => i.style.borderColor = 'var(--card-border)');
                e.target.style.borderColor = 'var(--hud-primary)';
                if (profileAvatarUrl) profileAvatarUrl.value = e.target.src;
            });
        });

        // --- 5. GUARDAR PERFIL DEL PILOTO ---
        if (btnSaveProfile) {
            btnSaveProfile.addEventListener('click', async () => {
                try {
                    btnSaveProfile.disabled = true;
                    const newName = profilePilotName?.value.trim();
                    const newAvatar = profileAvatarUrl?.value.trim();

                    const { error } = await authService.updateProfile({
                        pilot_name: newName,
                        avatar_url: newAvatar
                    });

                    if (error) throw error;

                    const userLabel = document.getElementById('auth-user-label');
                    if (userLabel && newName) userLabel.textContent = newName;
                    if (hudAvatarImg && newAvatar) hudAvatarImg.src = newAvatar;

                    modalProfile.style.display = 'none';
                } catch (err) {
                    console.error("Error al actualizar perfil:", err);
                    alert("Error al guardar el perfil: " + err.message);
                } finally {
                    btnSaveProfile.disabled = false;
                }
            });
        }

        // --- 6. MANEJO DE COLORES EN MODAL DE GARAJE ---
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const colorKey = e.target.getAttribute('data-color');
                const currentModel = selectGarageCarModel?.value || storageService.getCarKey() || 'fiat_palio';
                storageService.setCarColor(colorKey);
                if (window.applyVehicleGarage) window.applyVehicleGarage(currentModel, colorKey);
            });
        });

        // --- 7. APLICAR CONFIGURACIÓN DE GARAJE (MODAL 3) ---
        if (btnSaveGarageConfig) {
            btnSaveGarageConfig.addEventListener('click', () => {
                const chosenCar = selectGarageCarModel ? selectGarageCarModel.value : 'fiat_palio';
                const currentColor = storageService.getCarColor() || 'rojo';
                
                storageService.setCarKey(chosenCar);
                if (window.applyVehicleGarage) window.applyVehicleGarage(chosenCar, currentColor);

                if (selectThemeMode && selectThemeMode.value) {
                    document.body.className = selectThemeMode.value;
                    storageService.setTheme(selectThemeMode.value);
                } else {
                    document.body.className = '';
                    storageService.setTheme('');
                }
                modalGarageConfig.style.display = 'none';
            });
        }

        // --- 8. GUARDAR FICHA TÉCNICA DEL VEHÍCULO (MODAL 2) ---
        if (btnSaveVehicle) {
            btnSaveVehicle.addEventListener('click', async () => {
                try {
                    btnSaveVehicle.disabled = true;
                    if (statusMsg) statusMsg.textContent = "GUARDANDO TELEMETRÍA...";

                    const selectedKey = specCarModel ? specCarModel.value : 'fiat_palio';
                    const currentColor = storageService.getCarColor() || 'rojo';

                    if (window.applyVehicleGarage) window.applyVehicleGarage(selectedKey, currentColor);

                    await vehicleService.saveVehicleSpec({
                        modelName: selectedKey,
                        engineType: specEngineType?.value || '',
                        oilType: specOilType?.value || '',
                        currentMileage: specMileage?.value || 0,
                        nextServiceKm: specNextService?.value || 0
                    });

                    const mileageLabel = document.getElementById('hud-mileage-val');
                    const serviceLabel = document.getElementById('hud-service-val');
                    if (mileageLabel && specMileage?.value) mileageLabel.textContent = `${specMileage.value} km`;
                    if (serviceLabel && specNextService?.value) serviceLabel.textContent = `${specNextService.value} km`;

                    if (statusMsg) statusMsg.textContent = "TELEMETRÍA GUARDADA CON ÉXITO.";
                    setTimeout(() => {
                        modalVehicle.style.display = 'none';
                        if (statusMsg) statusMsg.textContent = "";
                    }, 600);

                } catch (err) {
                    console.error("Error al guardar vehículo:", err);
                    if (statusMsg) statusMsg.textContent = err.message || "ERROR AL GUARDAR DATOS.";
                } finally {
                    btnSaveVehicle.disabled = false;
                }
            });
        }

        // --- 9. MÉTODOS PÚBLICOS DE APERTURA ---
        this.openProfileModal = async () => {
            if (modalProfile) modalProfile.style.display = 'flex';
            const { data } = await authService.getSession();
            const user = data?.session?.user;
            if (profilePilotName) profilePilotName.value = user?.user_metadata?.pilot_name || 'Invitado';
            if (profileEmail) profileEmail.value = user?.email || 'Sin sesión activa';
            if (profileAvatarUrl) profileAvatarUrl.value = user?.user_metadata?.avatar_url || '';
        };

        this.openVehicleModal = async () => {
            if (modalVehicle) modalVehicle.style.display = 'flex'; // Apertura instantánea
            const data = await vehicleService.getActiveVehicleData();
            if (data) {
                if (data.model_name && specCarModel) specCarModel.value = data.model_name;
                if (specEngineType) specEngineType.value = data.engine_type || '';
                if (specOilType) specOilType.value = data.oil_type || '';
                if (specMileage) specMileage.value = data.current_mileage || '';
                if (specNextService) specNextService.value = data.next_service_km || '';
            }
        };

        this.openSettingsModal = () => {
            if (selectGarageCarModel) selectGarageCarModel.value = storageService.getCarKey() || 'fiat_palio';
            if (selectThemeMode) selectThemeMode.value = storageService.getTheme() !== 'cyan' ? storageService.getTheme() : '';
            if (modalGarageConfig) modalGarageConfig.style.display = 'flex';
        };
    }
};