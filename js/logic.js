/**
 * @file logic.js
 * @description Business logic: data filtering, sorting, and map bounds search
 */

window.App = window.App || {};

App.Logic = {
    /**
     * Memuat data gempa dari provider aktif (USGS atau BMKG)
     */
    async fetchEarthquakeData(isSilent = false) {
        const refreshIcon = document.getElementById('refresh-icon');
        if (!isSilent && refreshIcon) refreshIcon.classList.add('fa-spin');

        const provider = document.getElementById('api-provider').value;
        const regionKey = document.getElementById('region-filter').value;
        const timeKey = document.getElementById('time-filter').value;
        const minMag = parseFloat(document.getElementById('mag-filter').value) || 0;
        
        let customBounds = null;
        if (regionKey === 'CUSTOM_MAP' && App.Map.instance) {
            const bounds = App.Map.instance.getBounds();
            customBounds = { s: bounds.getSouth(), n: bounds.getNorth(), w: bounds.getWest(), e: bounds.getEast() };
        }

        try {
            if (provider === 'USGS') {
                App.State.rawFetchedEarthquakes = await App.Data.fetchUSGSData(provider, regionKey, timeKey, minMag, customBounds);
            } else {
                App.State.rawFetchedEarthquakes = await App.Data.fetchBMKGData();
            }
            this.applyLocalFilters();
        } catch (err) {
            console.error("Gagal mengambil data gempa:", err);
            App.UI.showToast("Gagal memperbarui data gempa", "error");
        } finally {
            if (!isSilent && refreshIcon) refreshIcon.classList.remove('fa-spin');
        }
    },

    /**
     * Mengambil data gempa sesuai batas viewport peta saat ini
     */
    fetchDataForCurrentMapBounds() {
        const searchAreaBtn = document.getElementById('search-area-btn');
        if (searchAreaBtn) {
            searchAreaBtn.classList.add('hidden');
            searchAreaBtn.classList.remove('flex');
        }
        
        const regionSelect = document.getElementById('region-filter');
        if (regionSelect && ![...regionSelect.options].some(o => o.value === 'CUSTOM_MAP')) {
            const opt = document.createElement('option');
            opt.value = 'CUSTOM_MAP';
            opt.text = '📍 Area Peta Saat Ini';
            regionSelect.add(opt, 0); 
        }
        if (regionSelect) regionSelect.value = 'CUSTOM_MAP';
        
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';
        
        this.fetchEarthquakeData();
    },

    /**
     * Menerapkan filter lokal (magnitudo minimum & pencarian teks wilayah)
     */
    applyLocalFilters() {
        const minMag = parseFloat(document.getElementById('mag-filter').value) || 0;
        const searchInput = document.getElementById('search-input');
        const searchInputVal = App.Utils.escapeHTML((searchInput ? searchInput.value : '').toLowerCase().trim());

        let matchedKeywords = [searchInputVal];
        let matchedRegionConfig = null;

        if (searchInputVal) {
            for (const key in App.Config.REGION_ALIASES) {
                if (App.Config.REGION_ALIASES[key].keywords.some(kw => searchInputVal.includes(kw))) {
                    matchedKeywords = App.Config.REGION_ALIASES[key].keywords;
                    matchedRegionConfig = App.Config.REGION_ALIASES[key];
                    break;
                }
            }
        }

        App.State.filteredEarthquakes = App.State.rawFetchedEarthquakes.filter(eq => {
            if (eq.mag < minMag) return false;
            if (!searchInputVal) return true;
            const place = eq.place.toLowerCase();
            return matchedKeywords.some(kw => place.includes(kw));
        });

        this.sortData();
        App.UI.updateLatestQuakeBanner();

        if (matchedRegionConfig && App.Map.instance) {
            App.Map.isProgrammaticMove = true; 
            App.Map.instance.setView(matchedRegionConfig.center, matchedRegionConfig.zoom, { animate: false });
        }

        App.Map.renderMarkers(!!matchedRegionConfig);
        App.Map.syncTableWithBounds();
        App.UI.updateSortIcons();
    },

    /**
     * Mengurutkan data gempa terfilter sesuai konfigurasi kolom dan arah sortir
     */
    sortData() {
        const { column, direction } = App.State.sortConfig;
        App.State.filteredEarthquakes.sort((a, b) => {
            if (direction === 'asc') return a[column] > b[column] ? 1 : -1;
            else return a[column] < b[column] ? 1 : -1;
        });
    },

    /**
     * Handler klik pengurutan pada header tabel gempa
     */
    handleSort(columnKey) {
        if (App.State.sortConfig.column === columnKey) {
            App.State.sortConfig.direction = App.State.sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            App.State.sortConfig.column = columnKey;
            App.State.sortConfig.direction = (columnKey === 'depth') ? 'asc' : 'desc'; 
        }
        this.sortData();
        App.Map.syncTableWithBounds();
        App.UI.updateSortIcons();
    },

    /**
     * Mengatur ulang seluruh filter pencarian ke kondisi awal
     */
    resetFilters() {
        document.getElementById('api-provider').value = 'USGS';
        document.getElementById('region-filter').value = 'INDONESIA';
        document.getElementById('time-filter').value = '7d';
        document.getElementById('mag-filter').value = '0';
        document.getElementById('mag-val').innerText = '0.0';
        document.getElementById('search-input').value = '';
        document.getElementById('custom-date-container').classList.add('hidden');
        
        const searchAreaBtn = document.getElementById('search-area-btn');
        if (searchAreaBtn) searchAreaBtn.classList.add('hidden');
        
        App.UI.toggleProviderSettings();
    }
};
