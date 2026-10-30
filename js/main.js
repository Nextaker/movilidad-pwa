// js/main.js - Orquestador Principal Overdrive & Carrusel 3D
import { storageService } from './services/storageService.js';
import { mapService } from './services/mapService.js';
import { themeUI } from './ui/themeUI.js';
import { audioPlayerUI } from './ui/audioPlayerUI.js';
import { authUI } from './ui/authUI.js';
import { garageUI } from './ui/garageUI.js';
import { CAR_CATALOG } from './config.js';
import { bootUI } from './ui/bootUI.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("⚡ Overdrive HUD Modular Inicializado");

    // 1. Inicializar Módulos de UI
    themeUI.init();
    audioPlayerUI.init();
    authUI.init();
    garageUI.init();
    bootUI.init();

    // 2. Elementos DOM
    const garageView = document.getElementById('garage-view');
    const mapView = document.getElementById('map-view');
    const btnBackGarage = document.getElementById('btn-back-garage');
    const btnToggleView = document.getElementById('btn-toggle-view');
    const toggleSvgIcon = document.getElementById('toggle-svg-icon');
    const toggleText = document.getElementById('toggle-text');
    const carousel = document.getElementById('cyber-carousel');
    const btnSyncData = document.getElementById('btn-sync-data');
    const displayCarName = document.getElementById('display-car-name');
    const garageContainer = document.querySelector('.garage-container');

    const btnPrev = document.getElementById('btn-prev-card');
    const btnNext = document.getElementById('btn-next-card');
    const btnBackMain = document.getElementById('btn-back-main');

    const mainCards = Array.from(document.querySelectorAll('.main-menu-card'));
    const garageSubCards = Array.from(document.querySelectorAll('.garage-sub-card'));

    let currentMenuState = 'MAIN';
    let activeIndex = 2;
    let isGrid = storageService.getGridMode();

    function aplicarModoVista(gridState) {
        if (!carousel) return;
        if (gridState && currentMenuState === 'MAIN') {
            carousel.classList.add('grid-mode');
            if (toggleSvgIcon) {
                toggleSvgIcon.innerHTML = `
                    <line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line>
                    <line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line>
                    <line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line>
                    <line x1="17" y1="16" x2="23" y2="16"></line>
                `;
            }
            if (toggleText) toggleText.textContent = 'Cinta 3D';
        } else {
            carousel.classList.remove('grid-mode');
            if (toggleSvgIcon) {
                toggleSvgIcon.innerHTML = `
                    <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
                `;
            }
            if (toggleText) toggleText.textContent = 'Cuadrícula';
        }
        storageService.setGridMode(gridState);
    }

    aplicarModoVista(isGrid);

    if (btnToggleView) {
        btnToggleView.addEventListener('click', () => {
            if (currentMenuState === 'MAIN') {
                isGrid = !isGrid;
                aplicarModoVista(isGrid);
            }
        });
    }

    function renderCarousel() {
        const activeCards = currentMenuState === 'MAIN' ? mainCards : garageSubCards;

        activeCards.forEach((card, idx) => {
            card.classList.remove('active', 'card-left', 'card-right');
            if (idx === activeIndex) card.classList.add('active');
            else if (idx < activeIndex) card.classList.add('card-left');
            else card.classList.add('card-right');
        });
    }

    function switchMenuState(newState) {
        currentMenuState = newState;
        if (newState === 'GARAGE') {
            mainCards.forEach(c => { 
                c.style.display = 'none'; 
                c.classList.remove('active', 'card-left', 'card-right'); 
            });
            garageSubCards.forEach(c => c.style.display = 'flex');
            if (btnBackMain) btnBackMain.style.display = 'inline-block';
            if (btnToggleView) btnToggleView.style.display = 'none';
            carousel.classList.remove('grid-mode');
            activeIndex = 0; // Apuntar a la primera tarjeta del garaje (Profiles)
        } else {
            garageSubCards.forEach(c => { 
                c.style.display = 'none'; 
                c.classList.remove('active', 'card-left', 'card-right'); 
            });
            mainCards.forEach(c => c.style.display = 'flex');
            if (btnBackMain) btnBackMain.style.display = 'none';
            if (btnToggleView) btnToggleView.style.display = 'inline-flex';
            aplicarModoVista(isGrid);
            activeIndex = 2; // Apuntar a Favoritos en menú principal
        }
        renderCarousel();
    }

    if (btnBackMain) {
        btnBackMain.addEventListener('click', () => switchMenuState('MAIN'));
    }

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

    mainCards.forEach((card, idx) => {
        card.addEventListener('click', () => {
            if (currentMenuState !== 'MAIN') return;
            if (idx === activeIndex) {
                if (card.id === 'card-open-map') abrirMapa();
                else if (card.id === 'card-open-player') document.getElementById('btn-toggle-audio')?.click();
                else if (card.id === 'card-open-garage-menu') switchMenuState('GARAGE');
                else if (card.id === 'card-open-favorites') alert("Panel de Favoritos.");
                else if (card.id === 'card-open-ads') alert("Espacio Publicitario.");
                return;
            }
            activeIndex = idx;
            renderCarousel();
        });
    });

    garageSubCards.forEach((card, idx) => {
        card.addEventListener('click', () => {
            if (currentMenuState !== 'GARAGE') return;
            if (idx === activeIndex) {
                if (card.id === 'subcard-profiles') {
                    garageUI.openProfileModal();
                } else if (card.id === 'subcard-vehicle') {
                    garageUI.openVehicleModal();
                }
                return;
            }
            activeIndex = idx;
            renderCarousel();
        });
    });

    function applyVehicleGarage(selectedKey, colorKey = 'rojo') {
        const selectedCar = CAR_CATALOG[selectedKey];
        if (selectedCar) {  
            if (displayCarName) displayCarName.textContent = selectedCar.name;  
            const imagePath = selectedCar.images[colorKey] || Object.values(selectedCar.images)[0];

            if (garageContainer) {
                garageContainer.style.background = `
                    linear-gradient(180deg, rgba(5, 8, 17, 0.1) 0%, rgba(5, 8, 17, 0.6) 100%), 
                    url('${imagePath}') no-repeat center center / cover
                `;
            }
            storageService.setCarKey(selectedKey);  
            storageService.setCarColor(colorKey);
        }  
    }

    window.applyVehicleGarage = applyVehicleGarage;

    const savedCarKey = storageService.getCarKey();  
    const savedColor = storageService.getCarColor();
    applyVehicleGarage(savedCarKey, savedColor);

    function abrirMapa() {
        if (garageView) garageView.style.display = 'none';
        if (mapView) mapView.style.display = 'block';
        mapService.initMap();
        mapService.resize();
    }

    if (btnBackGarage) {
        btnBackGarage.addEventListener('click', () => {
            if (mapView) mapView.style.display = 'none';
            if (garageView) garageView.style.display = 'flex';
        });
    }

    if (btnSyncData) {
        btnSyncData.addEventListener('click', () => {
            btnSyncData.style.transform = 'rotate(360deg)';
            btnSyncData.style.transition = 'transform 0.6s ease';
            mapService.loadGasStations();
            mapService.trackUserLocation();
            setTimeout(() => {
                btnSyncData.style.transform = 'none';
                btnSyncData.style.transition = 'none';
            }, 600);
        });
    }

    switchMenuState('MAIN');
});