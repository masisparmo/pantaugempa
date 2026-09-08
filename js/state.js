/**
 * @file state.js
 * @description Centralized application state management for Earthquakes and Volcanoes
 */

window.App = window.App || {};

App.State = {
    // Earthquake Data State
    rawFetchedEarthquakes: [],
    filteredEarthquakes: [],
    currentVisibleData: [],
    sortConfig: { column: 'time', direction: 'desc' },

    // UI & Appearance State
    isDarkMode: false,

    // Volcano Monitoring State (PVMBG MAGMA)
    volcanoes: [],
    volcanoStats: { awas: 0, siaga: 0, waspada: 0, normal: 0, total: 0 },
    isVolcanoVisible: true,
    volcanoFilter: 'elevated',
    volcanoLastUpdated: null
};
