// main.js - Núcleo de la PWA Overdrive (Arquitectura Modular & Supabase)
import { supabase } from './services/supabaseClient.js';

// Variables de Control de Vistas
const garageView = document.getElementById('garage-view');
const mapView = document.getElementById('map-view');
const btnOpenMap = document.getElementById('btn-open-map');
const btnBackGarage = document.getElementById('btn-back-garage');

let mapInitialized = false;
let map;

// Control de Navegación entre Vistas
if (btnOpenMap) {
    btnOpenMap.addEventListener('click', () => {
        garageView.style.display = 'none';
        mapView.style.display = 'block';

        if (!mapInitialized) {
            initMap();
            mapInitialized = true;
        } else {
            map.invalidateSize();
        }
    });
}

if (btnBackGarage) {
    btnBackGarage.addEventListener('click', () => {
        mapView.style.display = 'none';
        garageView.style.display = 'flex';
    });
}

// Inicializar Mapa de Estaciones
function initMap() {
    const puntoFijoCoords = [11.7167, -70.1333];
    map = L.map('map').setView(puntoFijoCoords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    cargarEstaciones();
}

// Cargar Estaciones desde Supabase
async function cargarEstaciones() {
    try {
        const { data: stations, error } = await supabase
            .from('gas_stations')
            .select('*');

        if (error) {
            console.error('Error al cargar estaciones:', error.message);
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
            console.log('Estaciones cargadas con éxito:', stations.length);
        }
    } catch (err) {
        console.error('Error inesperado al conectar con la BD:', err);
    }
}

// --- GESTIÓN DINÁMICA DEL GARAJE Y VEHÍCULO ---
const carModal = document.getElementById('car-modal');
const btnOpenModal = document.getElementById('btn-open-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnSaveCar = document.getElementById('btn-save-car');

const inputCarName = document.getElementById('input-car-name');
const inputCarImg = document.getElementById('input-car-img');
const displayCarName = document.getElementById('display-car-name');
const userCarImg = document.getElementById('user-car-img');

// Cargar datos guardados previamente en el navegador (Local) o Supabase
window.addEventListener('DOMContentLoaded', () => {
    const savedCarName = localStorage.getItem('user_car_name');
    const savedCarImg = localStorage.getItem('user_car_img');

    if (savedCarName && displayCarName) {
        displayCarName.textContent = savedCarName;
        if (inputCarName) inputCarName.value = savedCarName;
    }
    if (savedCarImg && userCarImg) {
        userCarImg.src = savedCarImg;
        if (inputCarImg) inputCarImg.value = savedCarImg;
    }
});

// Eventos del Modal
if (btnOpenModal) {
    btnOpenModal.addEventListener('click', () => {
        carModal.style.display = 'flex';
    });
}

if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => {
        carModal.style.display = 'none';
    });
}

if (btnSaveCar) {
    btnSaveCar.addEventListener('click', () => {
        const newName = inputCarName.value.trim();
        const newImg = inputCarImg.value.trim();

        if (newName && displayCarName) {
            displayCarName.textContent = newName;
            localStorage.setItem('user_car_name', newName);
        }

        if (newImg && userCarImg) {
            userCarImg.src = newImg;
            localStorage.setItem('user_car_img', newImg);
        }

        carModal.style.display = 'none';
    });
}

// --- PANEL DE PATROCINANTES Y FAVORITOS ---
const btnOpenAds = document.getElementById('btn-open-ads');
if (btnOpenAds) {
    btnOpenAds.addEventListener('click', () => {
        alert("Espacio comercial optimizado para marcas locales de Punto Fijo (Lubricantes, Auto-lavados, Repuestos).");
    });
}