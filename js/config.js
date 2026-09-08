/**
 * @file config.js
 * @description Centralized configuration, endpoints, geographic bounds, and GeoJSON data
 */

window.App = window.App || {};

App.Config = {
    // Map Defaults
    MAP_CENTER: [-2.5, 118.0],
    MAP_ZOOM: 5,
    
    // Tile Map Providers
    TILES: {
        LIGHT: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        DARK: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        DARK_ATTRIBUTION: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
    },

    // External GeoJSON Resources
    TECTONIC_PLATES_URL: 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json',
    
    // Volcano Data Endpoint
    VOLCANO_DATA_URL: './data/gunung-api.json',
    
    // BMKG TEWS Endpoints
    BMKG_M5_URL: 'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json',
    BMKG_FELT_URL: 'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json',

    // USGS Base Endpoint
    USGS_BASE_URL: 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson',
    
    // Region Aliases for Smart Zooming
    REGION_ALIASES: {
        'ntt': { keywords: ['ntt', 'nusa tenggara timur', 'flores', 'sumba', 'kupang', 'ende', 'maumere', 'alor', 'rote', 'timor'], center: [-9.5, 121.5], zoom: 7 },
        'ntb': { keywords: ['ntb', 'nusa tenggara barat', 'lombok', 'sumbawa', 'mataram', 'bima'], center: [-8.6, 117.5], zoom: 8 },
        'bali': { keywords: ['bali', 'denpasar', 'singaraja', 'kuta', 'ubud'], center: [-8.4, 115.2], zoom: 9 },
        'jawa timur': { keywords: ['jawa timur', 'jatim', 'malang', 'surabaya', 'banyuwangi', 'pacitan', 'blitar', 'java'], center: [-7.9, 112.6], zoom: 8 },
        'jawa tengah': { keywords: ['jawa tengah', 'jateng', 'semarang', 'cilacap', 'jogja', 'yogyakarta', 'solo', 'java'], center: [-7.5, 110.0], zoom: 8 },
        'jawa barat': { keywords: ['jawa barat', 'jabar', 'bandung', 'sukabumi', 'cianjur', 'garut', 'bogor', 'sunda', 'java'], center: [-6.9, 107.6], zoom: 8 },
        'sumatra': { keywords: ['sumatra', 'sumatera', 'aceh', 'medan', 'padang', 'bengkulu', 'lampung', 'nias', 'mentawai'], center: [-0.5, 101.5], zoom: 6 },
        'sulawesi': { keywords: ['sulawesi', 'palu', 'manado', 'makassar', 'gorontalo', 'minahasa', 'celebes'], center: [-2.0, 121.0], zoom: 6 },
        'maluku': { keywords: ['maluku', 'ambon', 'seram', 'banda', 'ternate', 'halmahera', 'molucca', 'ceram'], center: [-3.2, 128.5], zoom: 7 },
        'papua': { keywords: ['papua', 'jayapura', 'nabire', 'manokwari', 'sorong', 'merauke', 'biak', 'new guinea'], center: [-4.0, 138.0], zoom: 6 }
    },

    // USGS Geographic Regions
    REGION_BOUNDS: {
        'INDONESIA': { minlat: -11, maxlat: 6, minlon: 94, maxlon: 141 },
        'GLOBAL': null,
        'JAPAN': { minlat: 24, maxlat: 46, minlon: 122, maxlon: 146 },
        'PHILIPPINES': { minlat: 4, maxlat: 21, minlon: 116, maxlon: 127 },
        'TURKEY': { minlat: 34, maxlat: 43, minlon: 25, maxlon: 45 },
        'USA': { minlat: 24.5, maxlat: 49.5, minlon: -125, maxlon: -66.5 }
    },

    // Data Sesar Aktif PuSGeN
    INDO_FAULTS_GEOJSON: {
        "type": "FeatureCollection",
        "features": [
            { "type": "Feature", "properties": { "Name": "Sesar Cimandiri", "Risk": "Sesar Aktif", "Source": "PuSGeN" }, "geometry": { "type": "LineString", "coordinates": [[106.54, -7.02], [106.85, -6.92], [107.45, -6.82]] } },
            { "type": "Feature", "properties": { "Name": "Sesar Lembang", "Risk": "Sesar Aktif", "Source": "PuSGeN" }, "geometry": { "type": "LineString", "coordinates": [[107.53, -6.83], [107.61, -6.82], [107.72, -6.82]] } },
            { "type": "Feature", "properties": { "Name": "Sesar Baribis", "Risk": "Sesar Aktif", "Source": "PuSGeN" }, "geometry": { "type": "LineString", "coordinates": [[107.75, -6.65], [108.05, -6.72], [108.23, -6.81]] } },
            { "type": "Feature", "properties": { "Name": "Sesar Opak", "Risk": "Sesar Aktif", "Source": "PuSGeN" }, "geometry": { "type": "LineString", "coordinates": [[110.32, -8.05], [110.35, -7.92], [110.45, -7.75]] } },
            { "type": "Feature", "properties": { "Name": "Sesar Kendeng", "Risk": "Sesar Aktif", "Source": "PuSGeN" }, "geometry": { "type": "LineString", "coordinates": [[110.55, -7.25], [111.0, -7.35], [111.8, -7.42], [112.5, -7.48]] } },
            { "type": "Feature", "properties": { "Name": "Sesar Besar Sumatra", "Risk": "Sesar Aktif Utama", "Source": "PuSGeN" }, "geometry": { "type": "LineString", "coordinates": [[95.3, 5.5], [96.0, 4.5], [97.5, 3.0], [98.8, 2.0], [100.4, -0.9], [101.5, -2.0], [102.3, -3.2], [104.5, -5.5]] } },
            { "type": "Feature", "properties": { "Name": "Sesar Palu-Koro", "Risk": "Sesar Aktif Utama", "Source": "PuSGeN" }, "geometry": { "type": "LineString", "coordinates": [[119.7, 0.5], [119.85, -0.9], [120.1, -1.5], [120.5, -2.5]] } },
            { "type": "Feature", "properties": { "Name": "Sesar Naik Flores", "Risk": "Thrust Fault", "Source": "PuSGeN" }, "geometry": { "type": "LineString", "coordinates": [[114.5, -7.8], [115.5, -7.9], [116.5, -8.0], [118.5, -8.1], [121.0, -8.2]] } },
            { "type": "Feature", "properties": { "Name": "Sesar Sorong", "Risk": "Sesar Aktif Utama", "Source": "PuSGeN" }, "geometry": { "type": "LineString", "coordinates": [[128.5, -1.0], [130.5, -0.5], [131.3, -0.9], [132.5, -1.2], [134.0, -1.5]] } }
        ]
    }
};
