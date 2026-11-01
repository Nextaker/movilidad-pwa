import { DEFAULT_CAR_KEY, DEFAULT_PAINT_KEY } from '../config.js';

// js/services/storageService.js - Manejo de almacenamiento local
export const storageService = {
    getTheme() {
        return localStorage.getItem('overdrive_theme') || 'cyan';
    },
    setTheme(theme) {
        localStorage.setItem('overdrive_theme', theme);
    },
    getGridMode() {
        return localStorage.getItem('overdrive_grid_mode') === 'true';
    },
    setGridMode(isGrid) {
        localStorage.setItem('overdrive_grid_mode', isGrid);
    },
    getCarKey() {
        return localStorage.getItem('user_car_key') || DEFAULT_CAR_KEY;
    },
    setCarKey(key) {
        localStorage.setItem('user_car_key', key);
    },
    getCarColor() {
        return localStorage.getItem('user_car_color') || DEFAULT_PAINT_KEY;
    },
    setCarColor(color) {
        localStorage.setItem('user_car_color', color);
    },
    getMapEngine() {
        return localStorage.getItem('overdrive_map_engine') || 'leaflet_vec';
    },
    setMapEngine(engine) {
        localStorage.setItem('overdrive_map_engine', engine);
    }
};