// js/services/mapService.js - Control fluído de Leaflet con tarjetas ciseladas y diamante de estación
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

function createStationSvg(statusText, colorStatus, stationName) {
    return `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div class="hud-station-card">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${colorStatus}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="3" y1="22" x2="15" y2="22"/>
                    <line x1="4" y1="9" x2="14" y2="9"/>
                    <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/>
                    <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/>
                </svg>
                <div>
                    <span style="font-weight: bold; display: block; line-height: 1.1; color: #fff;">${stationName}</span>
                    <span style="color: ${colorStatus}; font-size: 8px; font-weight: 800; letter-spacing: 0.5px;">${statusText}</span>
                </div>
            </div>
            <div class="diamond-pin" style="margin-top: 2px;"></div>
        </div>
    `;
}

export const mapService = {
    initMap(containerId = 'map') {
        if (!map) {
            map = L.map(containerId).setView(CONFIG.DEFAULT_COORDS, CONFIG.DEFAULT_ZOOM);
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
    },

    toggleEngine(labelElement) {
        const nextEngine = currentEngine === 'leaflet_vec' ? 'leaflet_sat' : 'leaflet_vec';
        this.applyTileLayer(nextEngine);
        if (labelElement) {
            labelElement.textContent = nextEngine === 'leaflet_vec' ? 'Leaflet Vector' : 'Leaflet Satélite';
        }
    },

    async loadGasStations() {
        if (!map) return;
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
                    html: createStationSvg(estadoTexto, colorEstado, station.name),
                    iconSize: [130, 60], 
                    iconAnchor: [65, 0]
                });

                L.marker([station.latitude, station.longitude], { icon: stationIcon }).addTo(map);
            });
        } catch (err) {
            console.error('Error cargando estaciones:', err);
        }
    },

    trackUserLocation() {
        if (!map) return;

        const userPulseIcon = L.divIcon({
            className: 'user-location-marker',
            html: '<div class="gps-circle-pulse"></div>',
            iconSize: [26, 26],
            iconAnchor: [13, 13]
        });

        if (!userMarker) {
            userMarker = L.marker(CONFIG.DEFAULT_COORDS, { icon: userPulseIcon, zIndexOffset: 1000 }).addTo(map)
                .bindPopup("<b>¡Tu Ubicación Actual!</b>");
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