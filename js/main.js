// js/main.js - Orquestador Principal Overdrive & Carrusel 3D (Figma Submenu Sync)
import { storageService } from './services/storageService.js';
import { mapService } from './services/mapService.js';
import { themeUI } from './ui/themeUI.js';
import { audioPlayerUI } from './ui/audioPlayerUI.js';
import { authUI } from './ui/authUI.js';
import { garageUI } from './ui/garageUI.js';
import {
    CAR_CATALOG,
    CAR_PAINTS,
    DEFAULT_CAR_KEY,
    DEFAULT_PAINT_KEY
} from './config.js';
import { bootUI } from './ui/bootUI.js';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then((registration) => {
            console.info('Service Worker registrado:', registration.scope);
        })
        .catch((error) => {
            console.error('No se pudo registrar el Service Worker:', error);
        });
}

const LEGACY_CAR_KEYS = new Map([['aveo', 'chevrolet_aveo']]);
const LEGACY_PAINT_KEYS = new Map([
    ['rojo', 'obsidian'],
    ['negro', 'obsidian'],
    ['gris', 'titanium']
]);

document.addEventListener('DOMContentLoaded', () => {
    console.log("⚡ Overdrive HUD Modular Inicializado (Figma Redesign)");

    // 1. Inicializar Módulos de UI
    themeUI.init();
    audioPlayerUI.init();
    authUI.init();
    garageUI.init();
    bootUI.init();

    // 2. Referencias al DOM
    const garageView = document.getElementById('garage-view');
    const mapView = document.getElementById('map-view');
    const btnBackGarage = document.getElementById('btn-back-garage');
    const btnToggleLayer = document.getElementById('btn-toggle-map-layer');
    
    const carousel = document.getElementById('main-carousel');
    const mainCards = Array.from(document.querySelectorAll('.main-card'));
    const garageSubCards = Array.from(document.querySelectorAll('.garage-sub-card'));
    
    const btnPrev = document.getElementById('carousel-prev');
    const btnNext = document.getElementById('carousel-next');
    const activeCardNum = document.getElementById('active-card-num');
    const deckTitle = document.getElementById('deck-title');
    const deckSubtitle = document.getElementById('deck-subtitle');
    const dots = Array.from(document.querySelectorAll('#carousel-dots button'));

    const btnGarageConfig = document.getElementById('subcard-garage-config');
    const btnOpenMap = document.getElementById('btn-open-map');
    const btnEnterGarage = document.getElementById('btn-enter-garage');

    let currentMenuState = 'MAIN'; // 'MAIN' (5 tarjetas) o 'GARAGE' (3 tarjetas)
    let activeIndex = 0;

    function loadCardImages(card) {
        card.querySelectorAll('img[data-src]').forEach((image) => {
            image.src = image.dataset.src;
            image.removeAttribute('data-src');
            image.loading = 'eager';
        });
    }

    // --- RENDERIZADO DEL CARRUSEL 3D HOLOGRÁFICO ---
    function renderCarousel() {
        const activeCards = currentMenuState === 'MAIN' ? mainCards : garageSubCards;

        activeCards.forEach((card, idx) => {
            card.classList.remove('is-active', 'is-left', 'is-right', 'is-hidden');
            
            if (idx === activeIndex) {
                card.classList.add('is-active');
                loadCardImages(card);
            } else if (idx < activeIndex) {
                card.classList.add('is-left');
            } else {
                card.classList.add('is-right');
            }
        });

        if (activeCardNum) {
            const currentFormatted = String(activeIndex + 1).padStart(2, '0');
            const totalFormatted = String(activeCards.length).padStart(2, '0');
            activeCardNum.textContent = `${currentFormatted}/${totalFormatted}`;
        }

        // Actualizar los puntos inferiores
        dots.forEach((dot, idx) => {
            if (idx < activeCards.length) {
                dot.style.display = 'block';
                dot.classList.toggle('is-active', idx === activeIndex);
            } else {
                dot.style.display = 'none';
            }
        });
    }

    // --- CAMBIO DE ESTADO (MENÚ PRINCIPAL vs SUBMENÚ GARAJE) ---
    function switchMenuState(newState) {
        currentMenuState = newState;
        activeIndex = 0;

        if (newState === 'GARAGE') {
            mainCards.forEach(c => {
                c.style.display = 'none';
                c.classList.remove('is-active', 'is-left', 'is-right');
            });
            garageSubCards.forEach(c => c.style.display = 'block');
            
            if (deckTitle) deckTitle.textContent = "CONFIGURE MACHINE IDENTITY";
            if (deckSubtitle) deckSubtitle.textContent = "OVERDRIVE // GARAGE CORE";
        } else {
            garageSubCards.forEach(c => {
                c.style.display = 'none';
                c.classList.remove('is-active', 'is-left', 'is-right');
            });
            mainCards.forEach(c => c.style.display = 'block');
            
            if (deckTitle) deckTitle.textContent = "SELECT SYSTEM MODULE";
            if (deckSubtitle) deckSubtitle.textContent = "OVERDRIVE // GARAGE CORE";
        }
        renderCarousel();
    }

    // --- CONTROLES Y EVENTOS DE NAVEGACIÓN ---
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            const activeCards = currentMenuState === 'MAIN' ? mainCards : garageSubCards;
            if (activeIndex < activeCards.length - 1) {
                activeIndex++;
                renderCarousel();
            }
        });
    }

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (activeIndex > 0) {
                activeIndex--;
                renderCarousel();
            }
        });
    }

    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
            activeIndex = idx;
            renderCarousel();
        });
    });

    let touchStart = null;
    let suppressSwipeClickUntil = 0;

    if (carousel) {
        carousel.addEventListener('pointerdown', (event) => {
            if (event.pointerType !== 'touch' || !event.isPrimary ||
                !(event.target instanceof Element) ||
                event.target.closest('button, a, input, select, textarea, [contenteditable="true"]')) {
                touchStart = null;
                return;
            }

            touchStart = {
                pointerId: event.pointerId,
                x: event.clientX,
                y: event.clientY
            };
        });

        window.addEventListener('pointerup', (event) => {
            if (!touchStart || event.pointerId !== touchStart.pointerId) return;

            const deltaX = event.clientX - touchStart.x;
            const deltaY = event.clientY - touchStart.y;
            touchStart = null;

            if (Math.abs(deltaX) < 30 || Math.abs(deltaX) < Math.abs(deltaY) * 1.15) return;

            const activeCards = currentMenuState === 'MAIN' ? mainCards : garageSubCards;
            const nextIndex = activeIndex + (deltaX < 0 ? 1 : -1);
            if (nextIndex < 0 || nextIndex >= activeCards.length) return;

            activeIndex = nextIndex;
            suppressSwipeClickUntil = Date.now() + 400;
            renderCarousel();
        });

        window.addEventListener('pointercancel', (event) => {
            if (touchStart?.pointerId === event.pointerId) touchStart = null;
        });

        carousel.addEventListener('click', (event) => {
            if (Date.now() > suppressSwipeClickUntil || event.detail === 0) return;
            suppressSwipeClickUntil = 0;
            event.preventDefault();
            event.stopImmediatePropagation();
        }, true);
    }

    // Clic en las tarjetas del menú principal
    mainCards.forEach((card, idx) => {
        card.addEventListener('click', () => {
            if (currentMenuState !== 'MAIN') return;
            if (idx === activeIndex) {
                ejecutarAccionTarjetaMain(card.id);
                return;
            }
            activeIndex = idx;
            renderCarousel();
        });
    });

    // Clic en las tarjetas del submenú de garaje
    garageSubCards.forEach((card, idx) => {
        card.addEventListener('click', () => {
            if (currentMenuState !== 'GARAGE') return;
            if (idx === activeIndex) {
                ejecutarAccionTarjetaGarage(card.id);
                return;
            }
            activeIndex = idx;
            renderCarousel();
        });
    });

    function ejecutarAccionTarjetaMain(cardId) {
        if (cardId === 'subcard-map') {
            abrirMapa();
        } else if (cardId === 'subcard-audio') {
            document.getElementById('btn-toggle-audio')?.click();
        } else if (cardId === 'subcard-favorites') {
            alert("Panel de Favoritos y Rutas Guardadas.");
        } else if (cardId === 'subcard-garage-trigger') {
            switchMenuState('GARAGE');
        } else if (cardId === 'subcard-ads') {
            alert("Espacio Publicitario / Paraguaná Tires.");
        }
    }

    function ejecutarAccionTarjetaGarage(cardId) {
        if (cardId === 'garage-sub-profile') {
            garageUI.openProfileModal();
        } else if (cardId === 'garage-sub-telemetry') {
            garageUI.openVehicleModal();
        } else if (cardId === 'garage-sub-style') {
            garageUI.openSettingsModal();
        }
    }

    // --- ACCIONES DIRECTAS DE BOTONES INTERNOS ---
    if (btnOpenMap) {
        btnOpenMap.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirMapa();
        });
    }

    if (btnEnterGarage) {
        btnEnterGarage.addEventListener('click', (e) => {
            e.stopPropagation();
            switchMenuState('GARAGE');
        });
    }

    if (btnGarageConfig) {
        btnGarageConfig.addEventListener('click', () => {
            const nextState = currentMenuState === 'MAIN' ? 'GARAGE' : 'MAIN';
            switchMenuState(nextState);
        });
    }

    // --- GESTIÓN DE VEHÍCULO Y GARAJE ---
    function applyVehicleGarage(selectedKey, colorKey = DEFAULT_PAINT_KEY) {
        const carKey = Object.hasOwn(CAR_CATALOG, selectedKey)
            ? selectedKey
            : LEGACY_CAR_KEYS.get(selectedKey) || DEFAULT_CAR_KEY;
        const paint = CAR_PAINTS.includes(colorKey)
            ? colorKey
            : LEGACY_PAINT_KEYS.get(colorKey) || DEFAULT_PAINT_KEY;
        const selectedCar = CAR_CATALOG[carKey];

        document.querySelectorAll('.garage-car, .config-preview').forEach(preview => {
            const image = preview.querySelector('img');
            if (image) {
                image.alt = selectedCar.name;
                const activePreview = preview.closest('.holo-card')?.classList.contains('is-active');
                if (activePreview) {
                    image.src = selectedCar.image;
                    image.removeAttribute('data-src');
                } else {
                    image.dataset.src = selectedCar.image;
                    image.removeAttribute('src');
                }
            }

            const paintLayer = preview.querySelector('.paint-layer');
            if (paintLayer) {
                paintLayer.classList.remove(...CAR_PAINTS.map(paintKey => `paint-layer--${paintKey}`));
                paintLayer.classList.add(`paint-layer--${paint}`);
            }

            const label = preview.querySelector('.car-tag, small');
            if (label) {
                label.textContent = preview.classList.contains('garage-car')
                    ? selectedCar.name.toUpperCase()
                    : `LIVE MATERIAL PREVIEW // ${selectedCar.name.toUpperCase()}`;
            }
        });

        document.querySelectorAll('#car-model-selector [data-car]').forEach(button => {
            button.classList.toggle('is-active', button.dataset.car === carKey);
        });
        document.querySelectorAll('#car-paint-selector [data-color]').forEach(button => {
            button.classList.toggle('is-active', button.dataset.color === paint);
        });
        document.querySelectorAll('#ui-theme-selector [data-theme]').forEach(button => {
            button.classList.toggle('is-active', button.dataset.theme === storageService.getTheme());
        });

        storageService.setCarKey(carKey);
        storageService.setCarColor(paint);
    }

    window.applyVehicleGarage = applyVehicleGarage;

    const savedCarKey = storageService.getCarKey();
    const savedColor = storageService.getCarColor();
    applyVehicleGarage(savedCarKey, savedColor);

    // --- CONTROL DEL MAPA GPS ---
    async function abrirMapa() {
        if (garageView) garageView.style.display = 'none';
        if (mapView) mapView.style.display = 'block';
        try {
            await mapService.initMap();
            mapService.resize();
        } catch (error) {
            console.error('No se pudo iniciar el mapa:', error);
            if (mapView) mapView.style.display = 'none';
            if (garageView) garageView.style.display = 'flex';
            alert('No se pudo cargar el mapa. Comprueba tu conexión e inténtalo de nuevo.');
        }
    }

    if (btnBackGarage) {
        btnBackGarage.addEventListener('click', () => {
            if (mapView) mapView.style.display = 'none';
            if (garageView) garageView.style.display = 'flex';
        });
    }

    if (btnToggleLayer) {
        btnToggleLayer.addEventListener('click', () => {
            const current = mapService.getCurrentEngine();
            const next = current === 'leaflet_vec' ? 'leaflet_sat' : 'leaflet_vec';
            mapService.applyTileLayer(next);
            btnToggleLayer.textContent = next === 'leaflet_vec' ? '[ CAMBIAR A SATÉLITE ]' : '[ CAMBIAR A VECTOR ]';
        });
    }

    // Inicializar carrusel en el menú principal
    switchMenuState('MAIN');
});