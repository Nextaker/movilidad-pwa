// js/main.js - Controlador Principal Overdrive (Versión Consumidor / Usuario)  
import { supabase } from './services/supabaseClient.js';  
  
document.addEventListener('DOMContentLoaded', () => {  
    console.log("⚡ Overdrive HUD Inicializado (Usuario)");  
  
    // --- 1. ELEMENTOS DEL DOM ---  
    const garageView = document.getElementById('garage-view');  
    const mapView = document.getElementById('map-view');  
    const btnOpenMap = document.getElementById('btn-open-map');  
    const btnBackGarage = document.getElementById('btn-back-garage');  
    const cardOpenMap = document.getElementById('card-open-map');
  
    // Modal y Controles  
    const carModal = document.getElementById('car-modal');  
    const btnOpenModal = document.getElementById('btn-open-modal');  
    const btnCloseModal = document.getElementById('btn-close-modal');  
    const btnSaveCar = document.getElementById('btn-save-car');  
    const selectCarModel = document.getElementById('select-car-model');  
    const displayCarName = document.getElementById('display-car-name');  
    const garageContainer = document.querySelector('.garage-container'); 
  
    const btnRotateView = document.getElementById('btn-rotate-view');  
    const btnOpenAds = document.getElementById('btn-open-ads');  

    // --- CIERRE DE ADVERTENCIA DE ORIENTACIÓN ---  
    const btnCloseWarning = document.getElementById('btn-close-warning');  
    const orientationWarning = document.getElementById('orientation-warning');  
      
    if (btnCloseWarning && orientationWarning) {  
        btnCloseWarning.addEventListener('click', () => {  
            orientationWarning.style.display = 'none';  
        });  
    }  
  
    // Registrar Service Worker  
    if ('serviceWorker' in navigator) {  
        window.addEventListener('load', () => {  
            navigator.serviceWorker.register('./sw.js')  
                .then(reg => console.log('Service Worker registrado:', reg.scope))  
                .catch(err => console.log('Error Service Worker:', err));  
        });  
    }  
  
    // --- 2. CATÁLOGO DE VEHÍCULOS ---  
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
            console.log(`Garaje cargado: ${selectedCar.name} [${colorKey}]`);
        }  
    }  
  
    // --- MODAL ---  
    if (btnOpenModal) {  
        btnOpenModal.addEventListener('click', () => {  
            if (carModal) carModal.style.display = 'flex';  
        });  
    }  
  
    if (btnCloseModal) {  
        btnCloseModal.addEventListener('click', () => {  
            if (carModal) carModal.style.display = 'none';  
        });  
    }  
  
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
  
    if (btnRotateView) {  
        btnRotateView.style.display = 'none';  
    }  
  
    if (btnOpenAds) {  
        btnOpenAds.addEventListener('click', () => {  
            alert("Espacio comercial optimizado para marcas locales de Punto Fijo.");  
        });  
    }     

    // --- 3. GESTIÓN DE DOBLE MOTOR LEAFLET (Vector por defecto, Satélite secundario) ---  
    let mapInitialized = false;  
    let map = null;  
    let userMarker = null;
    let currentEngine = localStorage.getItem('overdrive_map_engine') || 'leaflet_vec'; // Vector por defecto

    const btnToggleEngine = document.getElementById('btn-toggle-engine');
    const engineLabel = document.getElementById('engine-label');

    if (btnToggleEngine && engineLabel) {
        engineLabel.textContent = currentEngine === 'leaflet_vec' ? 'Leaflet Vector' : 'Leaflet Satélite';

        btnToggleEngine.addEventListener('click', () => {
            currentEngine = currentEngine === 'leaflet_vec' ? 'leaflet_sat' : 'leaflet_vec';
            localStorage.setItem('overdrive_map_engine', currentEngine);
            alert(`Cambiando motor a ${currentEngine === 'leaflet_sat' ? 'Leaflet Satélite' : 'Leaflet Vector'}. Recargando...`);
            location.reload();
        });
    }

    // --- INICIALIZADOR DE LEAFLET UNIFICADO ---
    function initLeafletMap() {
        const puntoFijoCoords = [11.7167, -70.1333]; // [lat, lng]

        map = L.map('map').setView(puntoFijoCoords, 13);

        if (currentEngine === 'leaflet_sat') {
            // Capa Esri World Imagery (Satélite HD) - Opción Secundaria
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '&copy; Esri World Imagery',
                maxZoom: 19,
                maxNativeZoom: 17
            }).addTo(map);
        } else {
            // Capa OpenStreetMap (Vectorial Limpia) - Opción por Defecto
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 19
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
                        .bindPopup("<b>¡Tu Ubicación Actual (GPS)!</b>");
                }
            },
            (error) => console.warn("Error GPS Leaflet:", error.message),
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
                                <div class="hud-station-title">${station.name}</div>
                                <div class="hud-station-status">ESTADO: <span style="color: ${colorEstado}; font-weight: bold;">${estadoTexto}</span></div>
                            </div>
                        </div>
                    `,
                    iconSize: [120, 50],
                    iconAnchor: [60, 0]
                });

                L.marker([station.latitude, station.longitude], { icon: stationIcon }).addTo(map);
            });
        } catch (err) {  
            console.error('Error Supabase:', err);  
        }  
    }

    // --- MANEJO DE NAVEGACIÓN DE VISTAS Y MAPA ---
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

    if (btnOpenMap) btnOpenMap.addEventListener('click', abrirMapaSegunPreferencia);
    if (cardOpenMap) cardOpenMap.addEventListener('click', abrirMapaSegunPreferencia);

    if (btnBackGarage) {  
        btnBackGarage.addEventListener('click', () => {  
            if (mapView) mapView.style.display = 'none';  
            if (garageView) garageView.style.display = 'flex';  
        });  
    }

    // --- REPRODUCTOR DE MÚSICA HUD ---
    function inicializarReproductorHUD() {
        const musicWidget = document.createElement('div');
        musicWidget.innerHTML = `
            <div id="hud-audio-player" style="
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 999;
                background: rgba(5, 8, 17, 0.85);
                border: 1px solid #00f0ff;
                padding: 8px 12px;
                border-radius: 6px;
                font-family: 'Orbitron', sans-serif;
                font-size: 10px;
                color: #00f0ff;
                box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>🎵 HUD AUDIO</span>
                <button id="btn-toggle-audio" style="
                    background: #00f0ff;
                    color: #050811;
                    border: none;
                    padding: 4px 8px;
                    font-weight: bold;
                    cursor: pointer;
                    border-radius: 3px;
                ">PLAY</button>
            </div>
        `;
        document.body.appendChild(musicWidget);

        const audio = new Audio('./assets/audio/cyberpunk-bg.mp3');
        audio.loop = true;
        audio.volume = 0.3;

        const btnToggle = document.getElementById('btn-toggle-audio');
        let isPlaying = false;

        btnToggle.addEventListener('click', () => {
            if (!isPlaying) {
                audio.play().then(() => {
                    isPlaying = true;
                    btnToggle.textContent = 'MUTE';
                    btnToggle.style.background = '#ff0055';
                    btnToggle.style.color = '#fff';
                }).catch(err => console.log("Bloqueo de audio:", err));
            } else {
                audio.pause();
                isPlaying = false;
                btnToggle.textContent = 'PLAY';
                btnToggle.style.background = '#00f0ff';
                btnToggle.style.color = '#050811';
            }
        });
    }

    inicializarReproductorHUD();
});