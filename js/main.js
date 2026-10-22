// js/main.js - Controlador Principal Overdrive (Mapbox GL Native)  
import { supabase } from './services/supabaseClient.js';  
  
document.addEventListener('DOMContentLoaded', () => {  
    console.log("⚡ Overdrive HUD Inicializado (Mapbox GL)");  
  
    // --- 1. ELEMENTOS DEL DOM ---  
    const garageView = document.getElementById('garage-view');  
    const mapView = document.getElementById('map-view');  
    const btnOpenMap = document.getElementById('btn-open-map');  
    const btnBackGarage = document.getElementById('btn-back-garage');  
  
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
  
    // --- 2. CATÁLOGO DE VEHÍCULOS CON FONDOS COMPLETOS Y COLORES ---  
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

    // Función para aplicar garaje completo y color seleccionado
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
  
    // --- 3. NAVEGACIÓN VISTAS Y MAPA ---  
    let mapInitialized = false;  
    let map;  
  
    if (btnOpenMap) {  
        btnOpenMap.addEventListener('click', () => {  
            if (garageView) garageView.style.display = 'none';  
            if (mapView) mapView.style.display = 'block';  
  
            if (!mapInitialized) {  
                initMap();  
                mapInitialized = true;  
            } else if (map) {  
                map.resize(); // Reajustar contenedor de Mapbox al cambiar de vista
                detectarUbicacionUsuarioMapbox();
            }  
        });  
    }  
  
    if (btnBackGarage) {  
        btnBackGarage.addEventListener('click', () => {  
            if (mapView) mapView.style.display = 'none';  
            if (garageView) garageView.style.display = 'flex';  
        });  
    }  
  
    // --- 4. MODAL ---  
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
  
    // Cargar Preferencia Inicial  
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

    // --- MAPA MAPBOX GL NATIVO (Estilo Standard-Satellite) ---  
    function initMap() {  
        mapboxgl.accessToken = 'pk.eyJ1IjoibmV4dGFrZXIiLCJhIjoiY212NWxiN2Z4MDdpMTJ6b2cxeWQ3cjcwOSJ9.TI4OWazCfVGC0-rlCwkA2w';

        // Mapbox utiliza formato [longitud, latitud]
        const puntoFijoCoords = [-70.1333, 11.7167];  

        map = new mapboxgl.Map({  
            container: 'map', // ID del div en el HTML
            style: 'mapbox://styles/mapbox/standard-satellite', // Estilo satelital inmersivo
            center: puntoFijoCoords,  
            zoom: 13,
            pitch: 30 // Inclinación ligera para darle profundidad 3D industrial
        });  

        // Controles de navegación nativos de Mapbox (Zoom y orientación)
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Agregar botón GPS manual flotante
        agregarBotonGPSManualMapbox();

        map.on('load', () => {
            cargarEstacionesMapbox();
            detectarUbicacionUsuarioMapbox();
        });
    }

    // Botón flotante personalizado para Mapbox
    function agregarBotonGPSManualMapbox() {
        const customControl = document.createElement('div');
        customControl.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
        customControl.innerHTML = `
            <button title="Centrar GPS" style="
                background: rgba(10, 16, 30, 0.95); 
                color: #00f0ff; 
                border: none; 
                padding: 6px 10px; 
                cursor: pointer; 
                font-family: 'Orbitron', sans-serif;
                font-weight: bold;
                font-size: 11px;
            ">📍 GPS</button>
        `;
        customControl.onclick = (e) => {
            e.stopPropagation();
            detectarUbicacionUsuarioMapbox(true);
        };
        
        // Lo añadimos al control container de Mapbox
        const controlContainer = document.querySelector('.mapboxgl-ctrl-top-right');
        if (controlContainer) {
            controlContainer.appendChild(customControl);
        }
    }

    let userMarker = null;

    function detectarUbicacionUsuarioMapbox(forzarAlta = false) {  
        if (!("geolocation" in navigator)) {  
            alert("Tu navegador móvil no soporta geolocalización.");
            return;  
        }

        console.log("Solicitando geolocalización Mapbox...");

        const opcionesGPS = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(  
            (position) => {  
                const userLat = position.coords.latitude;  
                const userLng = position.coords.longitude;  

                console.log(`GPS Mapbox OK -> Lat: ${userLat}, Lng: ${userLng}`);

                // Volar suavemente hacia la posición actual
                map.flyTo({ center: [userLng, userLat], zoom: 16 });

                // Crear elemento visual para el marcador con pulso neón
                const el = document.createElement('div');
                el.className = 'user-location-marker';
                el.innerHTML = '<div class="gps-pulse"></div>';

                if (userMarker) {
                    userMarker.setLngLat([userLng, userLat]);
                } else {
                    userMarker = new mapboxgl.Marker(el)
                        .setLngLat([userLng, userLat])
                        .setPopup(new mapboxgl.Popup().setHTML("<b>¡Tu Ubicación Actual!</b>"))
                        .addTo(map);
                }
            },  
            (error) => {  
                console.warn("Error GPS Mapbox:", error.code, error.message);
                

                navigator.geolocation.getCurrentPosition(
                    (posFallback) => {
                        const lat = posFallback.coords.latitude;
                        const lng = posFallback.coords.longitude;
                        
                        map.flyTo({ center: [lng, lat], zoom: 15 });

                        const el = document.createElement('div');
                        el.className = 'user-location-marker';
                        el.innerHTML = '<div class="gps-pulse"></div>';

                        if (userMarker) {
                            userMarker.setLngLat([lng, lat]);
                        } else {
                            userMarker = new mapboxgl.Marker(el)
                                .setLngLat([lng, lat])
                                .setPopup(new mapboxgl.Popup().setHTML("<b>¡Ubicación Aproximada!</b>"))
                                .addTo(map);
                        }
                    },
                    (errFallback) => {
                        console.error("Error Fallback:", errFallback.message);
                    },
                    { enableHighAccuracy: false, timeout: 10000 }
                );
            },  
            opcionesGPS  
        );  
    }

    async function cargarEstacionesMapbox() {  
        try {  
            const { data: stations, error } = await supabase  
                .from('gas_stations')  
                .select('*');  
  
            if (error) {  
                console.warn('Error Supabase:', error.message);  
                return;  
            }  
  
            if (stations && stations.length > 0) {  
                stations.forEach(station => {  
                    let estadoTexto = "OPERATIVA";  
                    let colorEstado = "#00ff66";
                    if (station.status === 'closed') { estadoTexto = "CERRADA"; colorEstado = "#ff0055"; }
                    if (station.status === 'no_fuel') { estadoTexto = "SIN COMBUSTIBLE"; colorEstado = "#ffaa00"; }
  
                    // Contenedor principal del marcador (Diamante + Tarjeta HUD fija)
                    const el = document.createElement('div');
                    el.className = 'cyber-station-marker';
                    el.innerHTML = `
                        <div class="diamond-pin"></div>
                        <div class="hud-station-card">
                            <div class="hud-station-title">${station.name}</div>
                            <div class="hud-station-status">ESTADO: <span style="color: ${colorEstado}; font-weight: bold;">${estadoTexto}</span></div>
                        </div>
                    `;  
  
                    // Añadir marcador a Mapbox con anclaje superior para que la tarjeta quede debajo del diamante
                    new mapboxgl.Marker({ element: el, anchor: 'top' })
                        .setLngLat([station.longitude, station.latitude])
                        .addTo(map);
                });  
            }  
        } catch (err) {  
            console.error('Error de red al conectar con Supabase:', err);  
        }  
    
    }  

    // --- REPRODUCTOR DE MÚSICA AMBIENTAL HUD ---
    function inicializarReproductorHUD() {
        const hudContainer = document.querySelector('.garage-container') || document.body;
        
        // Creamos un widget flotante discreto para la música
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

        // Audio de fondo suave (Ejemplo de pista libre de tipo synthwave/lofi ambiental)
        // Puedes cambiar la URL por un archivo .mp3 alojado en tu carpeta 'assets/audio/'
        const audio = new Audio('./assets/audio/cyberpunk-bg.mp3');
        audio.loop = true;
        audio.volume = 0.3; // Volumen moderado y suave

        const btnToggle = document.getElementById('btn-toggle-audio');
        let isPlaying = false;

        btnToggle.addEventListener('click', () => {
            if (!isPlaying) {
                audio.play().then(() => {
                    isPlaying = true;
                    btnToggle.textContent = 'MUTE';
                    btnToggle.style.background = '#ff0055';
                    btnToggle.style.color = '#fff';
                }).catch(err => console.log("Bloqueo de audio por navegador:", err));
            } else {
                audio.pause();
                isPlaying = false;
                btnToggle.textContent = 'PLAY';
                btnToggle.style.background = '#00f0ff';
                btnToggle.style.color = '#050811';
            }
        });
    }

    // Llamar a la función al iniciar el DOM principal
    inicializarReproductorHUD();
});


