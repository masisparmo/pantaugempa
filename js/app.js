/**
 * PANTAU GEMPA & GUNUNG BERAPI - Application Bootstrap
 * Initializes map, chart, data fetching, and background refresh tickers.
 */

window.App = window.App || {};

App.init = function() {
    App.Map.init();
    App.UI.initChart();
    if (App.AI && App.AI.init) App.AI.init();
    App.Logic.fetchEarthquakeData();
    App.Data.fetchVolcanoData(); // Auto-load 69 PVMBG active volcanoes on startup
    
    // Live ticker update every 60s
    setInterval(() => {
        const texts = document.getElementById('banner-time-ago');
        if (texts && App.State.rawFetchedEarthquakes.length) {
            const latest = [...App.State.rawFetchedEarthquakes].sort((a, b) => b.time - a.time)[0];
            texts.innerText = App.Utils.formatTimeAgo(latest.time);
        }
    }, 60000);
    
    // Auto Refresh Earthquake Data every 3 minutes
    setInterval(() => {
        App.Logic.fetchEarthquakeData(true);
    }, 3 * 60 * 1000);
};

// Bootstrap App on DOMContentLoaded (with fallback to load)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
