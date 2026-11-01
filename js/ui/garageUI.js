// js/ui/garageUI.js - Control de Modales y Comportamiento Inteligente de Tarjetas 3D
import { vehicleService } from '../services/vehicleService.js';
import { storageService } from '../services/storageService.js';
import { authService } from '../services/authService.js';
import { themeUI } from './themeUI.js';
import { CAR_CATALOG, DEFAULT_CAR_KEY, DEFAULT_PAINT_KEY } from '../config.js';

export const garageUI = {
    init() {
        const modalProfile = document.getElementById('modal-pilot-profile');
        const btnCloseProfile = document.getElementById('btn-close-profile-modal');
        const btnSaveProfile = document.getElementById('btn-save-pilot-profile');
        const profilePilotName = document.getElementById('profile-pilot-name');
        const profileEmail = document.getElementById('profile-email');
        const profileAvatarUrl = document.getElementById('profile-avatar-url');
        const profileStatus = document.getElementById('profile-status');
        const hudAvatarImg = document.getElementById('hud-avatar-img');

        const modalVehicle = document.getElementById('modal-vehicle-spec');
        const btnCloseVehicle = document.getElementById('btn-close-vehicle-modal');
        const btnSaveVehicle = document.getElementById('btn-save-vehicle-spec');
        const specCarModel = document.getElementById('spec-car-model');
        const specEngineType = document.getElementById('spec-engine-type');
        const specOilType = document.getElementById('spec-oil-type');
        const specMileage = document.getElementById('spec-mileage');
        const specNextService = document.getElementById('spec-next-service');
        const statusMsg = document.getElementById('vehicle-spec-status');

        if (btnCloseProfile) btnCloseProfile.addEventListener('click', () => modalProfile.style.display = 'none');
        if (btnCloseVehicle) btnCloseVehicle.addEventListener('click', () => modalVehicle.style.display = 'none');

        [modalProfile, modalVehicle].forEach(m => {
            if (m) {
                m.addEventListener('click', (e) => {
                    if (e.target === m) m.style.display = 'none';
                });
            }
        });

        if (btnSaveProfile) {
            btnSaveProfile.addEventListener('click', async () => {
                try {
                    btnSaveProfile.disabled = true;
                    const newName = profilePilotName?.value.trim();
                    const newAvatar = profileAvatarUrl?.value.trim();
                    if (!newName) throw new Error('El call-sign no puede quedar vacío.');

                    const { data: sessionData, error: sessionError } = await authService.getSession();
                    if (sessionError) throw sessionError;
                    if (!sessionData.session?.user) {
                        throw new Error('Inicia sesión antes de actualizar tu perfil.');
                    }

                    const { data, error } = await authService.updateProfile({
                        pilot_name: newName,
                        avatar_url: newAvatar
                    });
                    if (error) throw error;

                    const userLabel = document.getElementById('auth-user-label');
                    if (userLabel) userLabel.textContent = data.user?.user_metadata?.pilot_name || newName;
                    if (hudAvatarImg) {
                        hudAvatarImg.src = data.user?.user_metadata?.avatar_url || './assets/componentes/7a5e6.svg';
                    }

                    const profileCardName = document.getElementById('profile-card-name');
                    const activeCallsignInput = document.getElementById('active-callsign-display');
                    if (profileCardName) profileCardName.textContent = newName;
                    if (activeCallsignInput) activeCallsignInput.value = newName;

                    if (profileStatus) profileStatus.textContent = 'PERFIL ACTUALIZADO.';
                    modalProfile.style.display = 'none';
                } catch (err) {
                    console.error('Error al actualizar perfil:', err);
                    if (profileStatus) profileStatus.textContent = err.message || 'ERROR AL GUARDAR EL PERFIL.';
                } finally {
                    btnSaveProfile.disabled = false;
                }
            });
        }

        if (btnSaveVehicle) {
            btnSaveVehicle.addEventListener('click', async () => {
                try {
                    btnSaveVehicle.disabled = true;
                    if (statusMsg) statusMsg.textContent = 'GUARDANDO TELEMETRÍA...';

                    const selectedKey = specCarModel ? specCarModel.value : DEFAULT_CAR_KEY;
                    const selectedCar = CAR_CATALOG[selectedKey];
                    if (!selectedCar) throw new Error('Selecciona un vehículo válido.');

                    const mileage = Number(specMileage?.value);
                    const nextService = Number(specNextService?.value);
                    if (!Number.isFinite(mileage) || mileage < 0 ||
                        !Number.isFinite(nextService) || nextService < 0) {
                        throw new Error('El odómetro y el próximo servicio deben ser valores válidos.');
                    }

                    const { data: sessionData, error: sessionError } = await authService.getSession();
                    if (sessionError) throw sessionError;
                    if (!sessionData.session?.user) {
                        throw new Error('Inicia sesión antes de guardar la telemetría.');
                    }

                    await vehicleService.saveVehicleSpec({
                        modelName: selectedKey,
                        engineType: specEngineType?.value.trim() || '',
                        oilType: specOilType?.value.trim() || '',
                        currentMileage: mileage,
                        nextServiceKm: nextService
                    });

                    const currentColor = storageService.getCarColor() || DEFAULT_PAINT_KEY;
                    if (window.applyVehicleGarage) window.applyVehicleGarage(selectedKey, currentColor);

                    const cardVehicleTitle = document.getElementById('card-vehicle-title');
                    const cardEngine = document.getElementById('card-spec-engine');
                    const cardOil = document.getElementById('card-spec-oil');
                    const cardMileage = document.getElementById('card-spec-odo');
                    const cardService = document.getElementById('card-spec-service');
                    if (cardVehicleTitle) cardVehicleTitle.textContent = selectedCar.name.toUpperCase();
                    if (cardEngine) cardEngine.textContent = specEngineType?.value.trim() || '—';
                    if (cardOil) cardOil.textContent = specOilType?.value.trim() || '—';
                    if (cardMileage) cardMileage.textContent = `${mileage.toLocaleString()} KM`;
                    if (cardService) cardService.textContent = `${nextService.toLocaleString()} KM`;

                    if (statusMsg) statusMsg.textContent = 'TELEMETRÍA GUARDADA CON ÉXITO.';
                    setTimeout(() => {
                        modalVehicle.style.display = 'none';
                        if (statusMsg) statusMsg.textContent = "";
                    }, 600);

                } catch (err) {
                    console.error('Error al guardar vehículo:', err);
                    if (statusMsg) statusMsg.textContent = err.message || 'ERROR AL GUARDAR DATOS.';
                } finally {
                    btnSaveVehicle.disabled = false;
                }
            });
        }

        this.openProfileModal = async () => {
            try {
                const { data, error } = await authService.getSession();
                if (error) throw error;
                const user = data?.session?.user;
                if (!user) {
                    document.dispatchEvent(new CustomEvent('overdrive:open-auth'));
                    return;
                }

                if (profilePilotName) profilePilotName.value = user.user_metadata?.pilot_name || '';
                if (profileEmail) profileEmail.value = user.email || '';
                if (profileAvatarUrl) profileAvatarUrl.value = user.user_metadata?.avatar_url || '';
                if (profileStatus) profileStatus.textContent = '';
                if (modalProfile) modalProfile.style.display = 'flex';
            } catch (err) {
                console.error('Error al cargar el perfil:', err);
                if (profileStatus) profileStatus.textContent = err.message || 'NO SE PUDO CARGAR EL PERFIL.';
                if (modalProfile) modalProfile.style.display = 'flex';
            }
        };

        this.openVehicleModal = async () => {
            if (modalVehicle) modalVehicle.style.display = 'flex';
            if (statusMsg) statusMsg.textContent = 'CARGANDO TELEMETRÍA...';
            try {
                const data = await vehicleService.getActiveVehicleData();
                if (data) {
                    const modelKey = Object.hasOwn(CAR_CATALOG, data.model_name)
                        ? data.model_name
                        : Object.entries(CAR_CATALOG).find(([, car]) => car.name === data.model_name)?.[0];
                    if (modelKey && specCarModel) specCarModel.value = modelKey;
                    if (specEngineType) specEngineType.value = data.engine_type || '';
                    if (specOilType) specOilType.value = data.oil_type || '';
                    if (specMileage) specMileage.value = data.current_mileage ?? '';
                    if (specNextService) specNextService.value = data.next_service_km ?? '';

                    const selectedCar = CAR_CATALOG[modelKey || DEFAULT_CAR_KEY];
                    const cardVehicleTitle = document.getElementById('card-vehicle-title');
                    const cardEngine = document.getElementById('card-spec-engine');
                    const cardOil = document.getElementById('card-spec-oil');
                    const cardMileage = document.getElementById('card-spec-odo');
                    const cardService = document.getElementById('card-spec-service');
                    if (cardVehicleTitle) cardVehicleTitle.textContent = selectedCar.name.toUpperCase();
                    if (cardEngine) cardEngine.textContent = data.engine_type || '—';
                    if (cardOil) cardOil.textContent = data.oil_type || '—';
                    if (cardMileage) cardMileage.textContent = `${Number(data.current_mileage || 0).toLocaleString()} KM`;
                    if (cardService) cardService.textContent = `${Number(data.next_service_km || 0).toLocaleString()} KM`;
                }
                if (statusMsg) statusMsg.textContent = '';
            } catch (err) {
                console.error('Error al cargar la ficha técnica:', err);
                if (statusMsg) statusMsg.textContent = err.message || 'NO SE PUDO CARGAR LA TELEMETRÍA.';
            }
        };

        this.openSettingsModal = () => {
            document.querySelector('#car-model-selector button')?.focus();
        };

        const carModelButtons = document.querySelectorAll('#car-model-selector button');
        carModelButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                carModelButtons.forEach(b => b.classList.remove('is-active'));
                const targetBtn = e.currentTarget;
                targetBtn.classList.add('is-active');
                const carKey = targetBtn.getAttribute('data-car');
                const currentColor = storageService.getCarColor() || DEFAULT_PAINT_KEY;
                
                // Solo cambia el material/modelo de fondo en el taller, NO el nombre técnico de la Tarjeta 02
                storageService.setCarKey(carKey);
                if (window.applyVehicleGarage) window.applyVehicleGarage(carKey, currentColor);
            });
        });

        const paintButtons = document.querySelectorAll('#car-paint-selector button');
        paintButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                paintButtons.forEach(b => b.classList.remove('is-active'));
                const targetBtn = e.currentTarget;
                targetBtn.classList.add('is-active');
                const colorKey = targetBtn.getAttribute('data-color');
                const currentCar = storageService.getCarKey() || DEFAULT_CAR_KEY;
                storageService.setCarColor(colorKey);
                if (window.applyVehicleGarage) window.applyVehicleGarage(currentCar, colorKey);
            });
        });

        const themeButtons = document.querySelectorAll('#ui-theme-selector button');
        themeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                themeButtons.forEach(b => b.classList.remove('is-active'));
                
                // e.currentTarget garantiza que agarremos el botón y no el <i> interno
                const targetBtn = e.currentTarget;
                targetBtn.classList.add('is-active');
                
                const themeName = targetBtn.getAttribute('data-theme');
                
                if (themeName) {
                    themeUI.applyTheme(themeName);
                    storageService.setTheme(themeName);
                }
            });
        });

        document.addEventListener('overdrive:open-profile', () => this.openProfileModal());
    }
};