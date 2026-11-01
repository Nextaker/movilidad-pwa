// js/services/mapService.js - Control fluido con clases tácticas de Figma
import { supabase } from './supabaseClient.js';
import { storageService } from './storageService.js';
import { CONFIG } from '../config.js';

let map = null;
let tileLayer = null;
let userMarker = null;
let currentEngine = storageService.getMapEngine();

const TILE_URLS = {
    leaflet_vec: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    leaflet_sat: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
};

// Generador de tarjeta táctica de estación basado en las clases de Figma
function createStationHtml(statusText, statusClass, stationName) {
    return `
        <div class="station-marker">
            <div class="station-card">
                <div class="station-card__rail">
                    <span>SECTOR // PARAGUANÁ</span>
                    <i>FUEL // 01</i>
                </div>
                <strong>${stationName}</strong>
                <div class="station-status ${statusClass}">
                    <i></i><span>${statusText}</span>
                </div>
                <div class="station-data">
                    <span><small>ESTADO</small>ACTIVO</span>
                    <span><small>RED</small>ONLINE</span>
                </div>
            </div>
            <div class="station-anchor"></div>
            <div class="station-pin"><i></i></div>
        </div>
    `;
}

export const mapService = {
    initMap(containerId = 'map') {
        if (!map) {
            map = L.map(containerId, { zoomControl: false }).setView(CONFIG.DEFAULT_COORDS, CONFIG.DEFAULT_ZOOM);
            this.applyTileLayer(currentEngine);
            this.loadGasStations();
        }

        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 200);

        this.trackUserLocation();
    },

    applyTileLayer(engine) {
        if (!map) return;
        if (tileLayer) {
            map.removeLayer(tileLayer); 
        }

        const attribution = engine === 'leaflet_sat' ? '© Esri World Imagery' : '© OpenStreetMap';
        tileLayer = L.tileLayer(TILE_URLS[engine], { attribution, maxZoom: 19 }).addTo(map);
        currentEngine = engine;
        storageService.setMapEngine(engine);

        // Aplicar clase visual al contenedor del mapa si es satélite
        const mapVisualContainer = document.querySelector('.map-visual');
        if (mapVisualContainer) {
            if (engine === 'leaflet_sat') {
                mapVisualContainer.classList.add('map-visual--satellite');
            } else {
                mapVisualContainer.classList.remove('map-visual--satellite');
            }
        }
    },

    async loadGasStations() {
        if (!map) return;
        try {
            const { data: stations, error } = await supabase.from('gas_stations').select('*');
            if (error || !stations) return;

            stations.forEach(station => {
                let estadoTexto = "OPERATIVA";
                let statusClass = "station-status--online";
                if (station.status === 'closed') { 
                    estadoTexto = "CERRADA"; 
                    statusClass = "station-status--offline"; 
                } else if (station.status === 'no_fuel') { 
                    estadoTexto = "SIN COMBUSTIBLE"; 
                    statusClass = "station-status--warning"; 
                }

                const stationIcon = L.divIcon({
                    className: 'custom-station-icon',
                    html: createStationHtml(estadoTexto, statusClass, station.name),
                    iconSize: [158, 120], 
                    iconAnchor: [79, 110]
                });

                L.marker([station.latitude, station.longitude], { icon: stationIcon }).addTo(map);
            });
        } catch (err) {
            console.error('Error cargando estaciones:', err);
        }
    },

    trackUserLocation() {
        if (!map) return;

        // Icono de radar y crosshair exacto del CSS de Figma
        const userRadarIcon = L.divIcon({
            className: 'custom-user-icon',
            html: `
                <div class="gps-location">
                    <div class="gps-ring"></div>
                    <div class="gps-ring gps-ring--two"></div>
                    <div class="gps-ring gps-ring--three"></div>
                    <div class="gps-crosshair">
                        <i></i>
                    </div>
                    <em>PUNTO FIJO // LIVE</em>
                </div>
            `,
            iconSize: [64, 64],
            iconAnchor: [32, 32]
        });

        if (!userMarker) {
            userMarker = L.marker(CONFIG.DEFAULT_COORDS, { icon: userRadarIcon, zIndexOffset: 1000 }).addTo(map)
                .bindPopup("<b>¡Tu Ubicación Actual (Netspace)!</b>");
        }

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;
                    
                    if (userMarker) {
                        userMarker.setLatLng([userLat, userLng]);
                    }
                    if (map) {
                        map.setView([userLat, userLng], 15);
                    }
                },
                (error) => {
                    console.warn("GPS no disponible:", error.message);
                },
                { enableHighAccuracy: true, timeout: 8000 }
            );
        }
    },

    resize() {
        if (map) map.invalidateSize();
    },

    getCurrentEngine() {
        return currentEngine;
    }
};