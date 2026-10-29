// js/main.js - Controlador Principal Overdrive  
import { supabase } from './services/supabaseClient.js';  
  
document.addEventListener('DOMContentLoaded', () => {  
    console.log("⚡ Overdrive HUD Inicializado");  
  
    // --- 1. ELEMENTOS DOM ---  
    const garageView = document.getElementById('garage-view');  
    const mapView = document.getElementById('map-view');  
    const btnBackGarage = document.getElementById('btn-back-garage');  
  
    const carModal = document.getElementById('car-modal');  
    const btnCloseModal = document.getElementById('btn-close-modal');  
    const btnSaveCar = document.getElementById('btn-save-car');  
    const selectCarModel = document.getElementById('select-car-model');  
    const displayCarName = document.getElementById('display-car-name');  
    const garageContainer = document.querySelector('.garage-container'); 

    // --- 1.1 PERSISTENCIA DE MODO (Cinta 3D vs Cuadrícula) ---
    const btnToggleView = document.getElementById('btn-toggle-view');
    const toggleIcon = document.getElementById('toggle-icon');
    const toggleText = document.getElementById('toggle-text');
    const carousel = document.getElementById('cyber-carousel');
    
    let savedGridMode = localStorage.getItem('overdrive_grid_mode') === 'true';

    function aplicarModoVista(isGrid) {
        if (!carousel) return;
        if (isGrid) {
            carousel.classList.add('grid-mode');
            if (toggleIcon) toggleIcon.textContent = '⚙️';
            if (toggleText) toggleText.textContent = 'Modo Cinta 3D';
        } else {
            carousel.classList.remove('grid-mode');
            if (toggleIcon) toggleIcon.textContent = '🔲';
            if (toggleText) toggleText.textContent = 'Modo Cuadrícula';
        }
        localStorage.setItem('overdrive_grid_mode', isGrid);
    }

    aplicarModoVista(savedGridMode);

    if (btnToggleView && carousel) {
        btnToggleView.addEventListener('click', () => {
            savedGridMode = !savedGridMode;
            aplicarModoVista(savedGridMode);
        });
    }

    // --- 1.2 GESTIÓN DE TEMAS GLOBALES DE LA APLICACIÓN ---
    const savedTheme = localStorage.getItem('overdrive_theme') || 'cyan';
    aplicarTemaGlobal(savedTheme);

    window.cambiarTemaGlobal = function(themeName) {
        localStorage.setItem('overdrive_theme', themeName);
        aplicarTemaGlobal(themeName);
    }

    function aplicarTemaGlobal(theme) {
        document.body.classList.remove('theme-cyan', 'theme-purple', 'theme-gold', 'theme-emerald');
        document.body.classList.add(`theme-${theme}`);
    }

    // --- 2. CATÁLOGO VEHÍCULOS ---  
    const carCatalog = {  
        'fiat_palio': {  
            name: 'Fiat Palio 1.8',  
            images: {
                'rojo': 'assets/garajes/garaje_palio_rojo.jpg',
                'negro': 'assets/garajes/garaje_palio_negro.jpg',
                'gris': 'assets/garajes/garaje_palio_gris.jpg'
            }
        },  
        'chevrolet_aveo': {  
            name: 'Chevrolet Aveo Speed',  
            images: {
                'rojo': 'assets/garajes/garaje_aveo_rojo.jpg',
                'negro': 'assets/garajes/garaje_aveo_negro.jpg',
                'gris': 'assets/garajes/garaje_aveo_gris.jpg'
            }  
        },  
        'toyota_corolla': {  
            name: 'Toyota Corolla',  
            images: {
                'rojo': 'assets/garajes/garaje_corolla_rojo.jpg',
                'negro': 'assets/garajes/garaje_corolla_negro.jpg',
                'gris': 'assets/garajes/garaje_corolla_gris.jpg'
            }  
        },  
        'chevrolet_optra': {  
            name: 'Chevrolet Optra Limited',  
            images: {
                'rojo': 'assets/garajes/garaje_optra_rojo.jpg',
                'negro': 'assets/garajes/garaje_optra_negro.jpg',
                'gris': 'assets/garajes/garaje_optra_gris.jpg'
            }  
        }  
    };  

    let currentColor = localStorage.getItem('user_car_color') || 'rojo';

    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentColor = e.target.getAttribute('data-color');
            const currentModel = selectCarModel ? selectCarModel.value : 'fiat_palio';
            applyVehicleGarage(currentModel, currentColor);
        });
    });

    function applyVehicleGarage(selectedKey, colorKey = 'rojo') {
        const selectedCar = carCatalog[selectedKey];
        if (selectedCar) {  
            if (displayCarName) displayCarName.textContent = selectedCar.name;  
            const imagePath = selectedCar.images[colorKey] || Object.values(selectedCar.images)[0];

            if (garageContainer) {
                garageContainer.style.background = `
                    linear-gradient(180deg, rgba(5, 8, 17, 0.1) 0%, rgba(5, 8, 17, 0.6) 100%), 
                    url('${imagePath}') no-repeat center center / cover
                `;
            }
            localStorage.setItem('user_car_key', selectedKey);  
            localStorage.setItem('user_car_color', colorKey);
        }  
    }  

    if (btnCloseModal) btnCloseModal.addEventListener('click', () => { if (carModal) carModal.style.display = 'none'; });

    if (btnSaveCar && selectCarModel) {  
        btnSaveCar.addEventListener('click', () => {  
            const selectedKey = selectCarModel.value;  
            applyVehicleGarage(selectedKey, currentColor);
            if (carModal) carModal.style.display = 'none';  
        });  
    }  

    const savedCarKey = localStorage.getItem('user_car_key') || 'fiat_palio';  
    const savedColor = localStorage.getItem('user_car_color') || 'rojo';
    applyVehicleGarage(savedCarKey, savedColor);  
    if (selectCarModel) selectCarModel.value = savedCarKey;  

    // --- 3. MAPAS LEAFLET ---  
    let mapInitialized = false;  
    let map = null;  
    let userMarker = null;
    let currentEngine = localStorage.getItem('overdrive_map_engine') || 'leaflet_vec';

    const btnToggleEngine = document.getElementById('btn-toggle-engine');
    const engineLabel = document.getElementById('engine-label');

    if (btnToggleEngine && engineLabel) {
        engineLabel.textContent = currentEngine === 'leaflet_vec' ? 'Leaflet Vector' : 'Leaflet Satélite';
        btnToggleEngine.addEventListener('click', () => {
            currentEngine = currentEngine === 'leaflet_vec' ? 'leaflet_sat' : 'leaflet_vec';
            localStorage.setItem('overdrive_map_engine', currentEngine);
            location.reload();
        });
    }

    function initLeafletMap() {
        const puntoFijoCoords = [11.7167, -70.1333];
        map = L.map('map').setView(puntoFijoCoords, 13);

        if (currentEngine === 'leaflet_sat') {
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '© Esri World Imagery', maxZoom: 19, maxNativeZoom: 17
            }).addTo(map);
        } else {
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors', maxZoom: 19
            }).addTo(map);
        }

        cargarEstacionesLeaflet();
        detectarUbicacionLeaflet();
    }

    function detectarUbicacionLeaflet() {
        if (!("geolocation" in navigator)) return;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                if (map) map.setView([userLat, userLng], 15);

                const pulseIcon = L.divIcon({
                    className: 'user-location-marker',
                    html: '<div class="gps-pulse"></div>',
                    iconSize: [24, 24]
                });

                if (userMarker) {
                    userMarker.setLatLng([userLat, userLng]);
                } else {
                    userMarker = L.marker([userLat, userLng], { icon: pulseIcon }).addTo(map)
                        .bindPopup("<b>¡Tu Ubicación Actual!</b>");
                }
            },
            (error) => console.warn("Error GPS:", error.message),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    async function cargarEstacionesLeaflet() {
        try {
            const { data: stations, error } = await supabase.from('gas_stations').select('*');
            if (error || !stations) return;

            stations.forEach(station => {
                let estadoTexto = "OPERATIVA";
                let colorEstado = "#00ff66";
                if (station.status === 'closed') { estadoTexto = "CERRADA"; colorEstado = "#ff0055"; }
                if (station.status === 'no_fuel') { estadoTexto = "SIN COMBUSTIBLE"; colorEstado = "#ffaa00"; }

                const stationIcon = L.divIcon({
                    className: 'cyber-station-marker',
                    html: `
                        <div style="display: flex; flex-direction: column; align-items: center;">
                            <div class="diamond-pin"></div>
                            <div class="hud-station-card">
                                <div>${station.name}</div>
                                <div><span style="color: ${colorEstado}; font-weight: bold;">${estadoTexto}</span></div>
                            </div>
                        </div>
                    `,
                    iconSize: [120, 50], iconAnchor: [60, 0]
                });

                L.marker([station.latitude, station.longitude], { icon: stationIcon }).addTo(map);
            });
        } catch (err) { console.error('Error Supabase:', err); }  
    }

    function abrirMapaSegunPreferencia() {
        if (garageView) garageView.style.display = 'none';  
        if (mapView) mapView.style.display = 'block';  

        if (!mapInitialized) {  
            initLeafletMap();
            mapInitialized = true;  
        } else if (map) {
            map.invalidateSize();
        }
    }

    if (btnBackGarage) {  
        btnBackGarage.addEventListener('click', () => {  
            if (mapView) mapView.style.display = 'none';  
            if (garageView) garageView.style.display = 'flex';  
        });  
    }

    // --- 4. REPRODUCTOR DE MÚSICA HUD CON AUTOPLAY AL PRIMER TOQUE ---
    function inicializarReproductorHUD() {
        const musicWidget = document.createElement('div');
        musicWidget.id = 'hud-audio-player';
        musicWidget.innerHTML = `
            <div class="audio-info-ticker">
                <span class="audio-status-tag">🎵 HUD AUDIO</span>
                <span class="audio-track-name">Cyberpunk Synthwave - Overdrive Track 01</span>
            </div>
            <button id="btn-toggle-audio">PLAY</button>
        `;
        document.body.appendChild(musicWidget);

        const audio = new Audio('./assets/audio/cyberpunk-bg.mp3');
        audio.loop = true;
        audio.volume = 0.3;

        const btnToggle = document.getElementById('btn-toggle-audio');
        let isPlaying = false;

        function reproducirAudio() {
            audio.play().then(() => {
                isPlaying = true;
                btnToggle.textContent = 'PAUSE';
                btnToggle.style.background = 'var(--hud-accent)';
                btnToggle.style.color = '#fff';
                btnToggle.style.boxShadow = '0 0 12px var(--hud-accent)';
            }).catch(err => console.log("Bloqueo de autoplay:", err));
        }

        function pausarAudio() {
            audio.pause();
            isPlaying = false;
            btnToggle.textContent = 'PLAY';
            btnToggle.style.background = 'var(--hud-primary)';
            btnToggle.style.color = '#050811';
            btnToggle.style.boxShadow = '0 0 10px var(--hud-primary)';
        }

        btnToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isPlaying) { reproducirAudio(); } else { pausarAudio(); }
        });

        const desbloquearAudioAlPrimerToque = () => {
            if (!isPlaying) { reproducirAudio(); }
            window.removeEventListener('pointerdown', desbloquearAudioAlPrimerToque);
            window.removeEventListener('touchstart', desbloquearAudioAlPrimerToque);
        };

        window.addEventListener('pointerdown', desbloquearAudioAlPrimerToque, { once: true });
        window.addEventListener('touchstart', desbloquearAudioAlPrimerToque, { once: true });
    }

    inicializarReproductorHUD();

    // --- 5. LÓGICA DE ROTACIÓN 3D, NAVEGACIÓN Y GESTOS TÁCTILES ---
    const cards = Array.from(document.querySelectorAll('.cyber-card'));
    const btnPrev = document.getElementById('btn-prev-card');
    const btnNext = document.getElementById('btn-next-card');
    let activeIndex = 2;

    function actualizarAngulosTransicion(index) {
        if (index < 0) { activeIndex = 0; }
        else if (index >= cards.length) { activeIndex = cards.length - 1; }
        else { activeIndex = index; }

        cards.forEach((card, idx) => {
            card.classList.remove('active', 'card-left', 'card-right');
            if (idx === activeIndex) { card.classList.add('active'); }
            else if (idx < activeIndex) { card.classList.add('card-left'); }
            else { card.classList.add('card-right'); }
        });
    }

    actualizarAngulosTransicion(activeIndex);

    cards.forEach((card, idx) => {
        card.addEventListener('click', () => {
            if (idx === activeIndex) {
                if (card.id === 'card-open-map') { abrirMapaSegunPreferencia(); }
                else if (card.id === 'card-open-player') {
                    const btnToggle = document.getElementById('btn-toggle-audio');
                    if (btnToggle) btnToggle.click();
                } else if (card.id === 'card-open-favorites') { alert("Panel de Favoritos."); }
                else if (card.id === 'card-open-modal') { if (carModal) carModal.style.display = 'flex'; }
                else if (card.id === 'card-open-ads') { alert("Espacio Publicitario."); }
                return;
            }
            actualizarAngulosTransicion(idx);
        });
    });

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            if (activeIndex < cards.length - 1) { actualizarAngulosTransicion(activeIndex + 1); }
        });
    }

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (activeIndex > 0) { actualizarAngulosTransicion(activeIndex - 1); }
        });
    }

    // --- SOPORTE TÁCTIL (SWIPE) ---
    let touchStartX = 0;
    let touchEndX = 0;
    const carouselStage = document.querySelector('.garage-stage');

    if (carouselStage) {
        carouselStage.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        carouselStage.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipeGesture();
        }, { passive: true });
    }

    function handleSwipeGesture() {
        const swipeThreshold = 40;
        if (touchEndX < touchStartX - swipeThreshold) {
            if (activeIndex < cards.length - 1) { actualizarAngulosTransicion(activeIndex + 1); }
        }
        if (touchEndX > touchStartX + swipeThreshold) {
            if (activeIndex > 0) { actualizarAngulosTransicion(activeIndex - 1); }
        }
    }
});