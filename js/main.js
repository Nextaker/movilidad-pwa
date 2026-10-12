// js/main.js - Controlador Principal Overdrive  
import { supabase } from './services/supabaseClient.js';  
  
document.addEventListener('DOMContentLoaded', () => {  
    console.log("⚡ Overdrive HUD Inicializado");  
  
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
  
            // Obtener la imagen según el color, o la primera disponible como respaldo
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
  
    // --- 3. NAVEGACIÓN VISTAS ---  
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
                map.invalidateSize();  
                // Forzar reubicación al abrir el mapa de nuevo
                detectarUbicacionUsuario();
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

    // --- MAPA LEAFLET ESCALABLE (CARTO-DB DARK MATTER) ---  
function initMap() {  
    const puntoFijoCoords = [11.7167, -70.1333];  
    map = L.map('map').setView(puntoFijoCoords, 13);  
  
    // Capa profesional oscura de CartoDB (Nítida, sin filtros borrosos y escalable)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {  
        maxZoom: 19,  
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxNativeZoom: 20
    }).addTo(map);  
  
    cargarEstaciones();  
    detectarUbicacionUsuario(); 
    agregarBotonGPSManual();
}  

// Botón flotante para control manual del GPS
function agregarBotonGPSManual() {
    const gpsControl = L.control({position: 'topright'});
    gpsControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        div.innerHTML = `
            <button title="Centrar en mi ubicación" style="
                background: rgba(10, 16, 30, 0.9); 
                color: #00f0ff; 
                border: 1px solid #00f0ff; 
                padding: 8px 12px; 
                cursor: pointer; 
                font-family: 'Orbitron', sans-serif;
                font-weight: bold;
                font-size: 11px;
                border-radius: 4px;
                box-shadow: 0 0 10px rgba(0, 240, 255, 0.4);
            ">📍 GPS</button>
        `;
        div.onclick = function(e) {
            e.stopPropagation();
            detectarUbicacionUsuario(true);
        }
        return div;
    };
    gpsControl.addTo(map);
}

let userMarker = null;

function detectarUbicacionUsuario(forzarAlta = false) {  
    if (!("geolocation" in navigator)) {  
        alert("Tu navegador móvil no soporta geolocalización.");
        return;  
    }

    console.log("Solicitando geolocalización al dispositivo...");

    const opcionesGPS = {
        enableHighAccuracy: true,
        timeout: 15000,           // 15 segundos de margen para móviles
        maximumAge: 0             // Forzar lectura fresca del sensor GPS
    };

    navigator.geolocation.getCurrentPosition(  
        (position) => {  
            const userLat = position.coords.latitude;  
            const userLng = position.coords.longitude;  

            console.log(`GPS OK -> Lat: ${userLat}, Lng: ${userLng}`);

            // Centrar mapa en la posición real
            map.setView([userLat, userLng], 16);  

            const userIcon = L.divIcon({  
                className: 'user-location-marker',  
                html: '<div class="gps-pulse"></div>',  
                iconSize: [24, 24]  
            });  

            if (userMarker) {
                userMarker.setLatLng([userLat, userLng]);
            } else {
                userMarker = L.marker([userLat, userLng], { icon: userIcon })  
                    .addTo(map)  
                    .bindPopup("<b>¡Tu Ubicación Actual!</b>")  
                    .openPopup();  
            }
        },  
        (error) => {  
            console.warn("Error GPS principal:", error.code, error.message);
            
            // Si el usuario denegó el permiso explícitamente
            if (error.code === 1) {
                alert("Permiso de ubicación denegado. Por favor, habilítalo en los ajustes de permisos de tu navegador.");
                return;
            }

            // Fallback a baja precisión si el GPS satelital tarda mucho
            navigator.geolocation.getCurrentPosition(
                (posFallback) => {
                    const lat = posFallback.coords.latitude;
                    const lng = posFallback.coords.longitude;
                    console.log(`GPS Fallback OK -> Lat: ${lat}, Lng: ${lng}`);
                    
                    map.setView([lat, lng], 15);

                    const userIcon = L.divIcon({
                        className: 'user-location-marker',
                        html: '<div class="gps-pulse"></div>',
                        iconSize: [24, 24]
                    });

                    if (userMarker) {
                        userMarker.setLatLng([lat, lng]);
                    } else {
                        userMarker = L.marker([lat, lng], { icon: userIcon })
                            .addTo(map)
                            .bindPopup("<b>¡Ubicación Aproximada (Red)!</b>")
                            .openPopup();
                    }
                },
                (errFallback) => {
                    console.error("Error GPS Fallback:", errFallback.message);
                    alert("No se pudo obtener la señal GPS. Verifica que la ubicación del teléfono esté activada.");
                },
                { enableHighAccuracy: false, timeout: 10000 }
            );
        },  
        opcionesGPS  
    );  
}
    async function cargarEstaciones() {  
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
                    let estadoTexto = "Desconocido";  
                    if (station.status === 'open') estadoTexto = "🟢 Abierta / Operativa";  
                    if (station.status === 'closed') estadoTexto = "🔴 Cerrada";  
                    if (station.status === 'no_fuel') estadoTexto = "🟡 Sin Combustible";  
  
                    const popupContent = `  
                        <b>${station.name}</b><br>  
                        Estado: ${estadoTexto}<br>  
                        Métodos de pago: ${station.payment_methods || 'No especificado'}  
                    `;  
  
                    L.marker([station.latitude, station.longitude])  
                        .addTo(map)  
                        .bindPopup(popupContent);  
                });  
            }  
        } catch (err) {  
            console.error('Error de red al conectar con Supabase:', err);  
        }  
    }  
});