/**
 * @file data.js
 * @description Data fetching, normalization, and CSV export for Earthquakes and Volcanoes
 */

window.App = window.App || {};

App.Data = {
    /**
     * Mengambil data gempa dari USGS API
     */
    async fetchUSGSData(provider, regionKey, timeKey, minMag, customBounds) {
        let startTimeStr = '', endTimeStr = '';
        const now = new Date();
        
        if (timeKey === '1h') startTimeStr = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        else if (timeKey === '24h') startTimeStr = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        else if (timeKey === '7d') startTimeStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        else if (timeKey === '30d') startTimeStr = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        else if (timeKey === '1y') startTimeStr = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
        else if (timeKey === 'custom') {
            const startInput = document.getElementById('start-date').value;
            const endInput = document.getElementById('end-date').value;
            if (startInput) startTimeStr = new Date(startInput).toISOString();
            if (endInput) endTimeStr = new Date(endInput + 'T23:59:59').toISOString();
        }

        let url = `${App.Config.USGS_BASE_URL}&limit=2000&minmagnitude=${minMag}`;
        if (startTimeStr) url += `&starttime=${startTimeStr}`;
        if (endTimeStr) url += `&endtime=${endTimeStr}`;

        if (customBounds) {
            url += `&minlatitude=${customBounds.s}&maxlatitude=${customBounds.n}&minlongitude=${customBounds.w}&maxlongitude=${customBounds.e}`;
        } else if (App.Config.REGION_BOUNDS[regionKey]) {
            const b = App.Config.REGION_BOUNDS[regionKey];
            url += `&minlatitude=${b.minlat}&maxlatitude=${b.maxlat}&minlongitude=${b.minlon}&maxlongitude=${b.maxlon}`;
        }

        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`USGS API Error: ${response.status} ${response.statusText}`);
        const data = await response.json();

        return data.features.map(f => {
            const coords = f.geometry.coordinates;
            let mmiVal = f.properties.mmi;
            let cdiVal = f.properties.cdi;
            
            return {
                id: f.id,
                mag: f.properties.mag || 0,
                place: f.properties.place || 'Unknown Location',
                time: f.properties.time,
                timeFormatted: new Date(f.properties.time).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
                lat: coords[1], lon: coords[0], depth: coords[2] ? Math.round(coords[2]) : 0,
                source: 'USGS',
                mmi: mmiVal ? App.Utils.getMMIRoman(mmiVal) : null,
                cdi: (!mmiVal && cdiVal) ? App.Utils.getMMIRoman(cdiVal) : null 
            };
        });
    },

    /**
     * Mengambil dan menggabungkan data gempa terbuka dari BMKG
     */
    async fetchBMKGData() {
        const ts = Date.now();
        const [res1, res2] = await Promise.all([
            fetch(`${App.Config.BMKG_M5_URL}?_t=${ts}`, { cache: 'no-store' }),
            fetch(`${App.Config.BMKG_FELT_URL}?_t=${ts}`, { cache: 'no-store' })
        ]);
        
        let list = [];
        if (res1.ok) {
            const d = await res1.json();
            (d.Infogempa?.gempa || []).forEach(g => list.push(this.parseBMKG(g, 'BMKG M≥5')));
        }
        if (res2.ok) {
            const d = await res2.json();
            (d.Infogempa?.gempa || []).forEach(g => list.push(this.parseBMKG(g, 'BMKG Dirasakan')));
        }

        // Deduplikasi menggunakan safeId komposit
        const unique = [];
        const seen = new Set();
        list.sort((a, b) => b.time - a.time).forEach(eq => {
            const safeId = `${eq.time}_${eq.lat}_${eq.lon}_${eq.mag}`;
            if (!seen.has(safeId)) { 
                seen.add(safeId); 
                unique.push(eq); 
            }
        });
        return unique;
    },

    /**
     * Normalisasi data gempa dari format JSON BMKG
     */
    parseBMKG(g, source) {
        const c = g.Coordinates ? g.Coordinates.split(',') : [0,0];
        const dirasakan = (g.Dirasakan && g.Dirasakan !== '-') ? g.Dirasakan : null;
        return {
            id: 'bmkg-' + g.DateTime,
            mag: parseFloat(g.Magnitude) || 0,
            place: g.Wilayah,
            time: new Date(g.DateTime || (g.Tanggal + ' ' + g.Jam)).getTime(),
            timeFormatted: `${g.Tanggal} - ${g.Jam}`,
            lat: parseFloat(c[0]), lon: parseFloat(c[1]), depth: parseFloat(g.Kedalaman) || 0,
            source: source,
            mmi: null, 
            cdi: dirasakan
        };
    },

    /**
     * Ekspor data gempa terfilter yang terlihat ke berkas CSV
     */
    exportToCSV() {
        if (App.State.currentVisibleData.length === 0) return alert("Tidak ada data untuk diekspor di area layar saat ini.");
        let csv = "Waktu,Magnitudo,Kedalaman_km,Latitude,Longitude,Lokasi,Intensitas_Dirasakan,Sumber\n";
        App.State.currentVisibleData.forEach(eq => {
            let placeStr = App.Utils.escapeHTML(eq.place).replace(/"/g, '""');
            let mmiStr = eq.mmi ? `MMI ${eq.mmi}` : (eq.cdi ? `CDI ${eq.cdi}` : '-');
            csv += `"${eq.timeFormatted}",${eq.mag},${eq.depth},${eq.lat},${eq.lon},"${placeStr}","${mmiStr}","${eq.source}"\n`;
        });
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const a = document.createElement('a'); a.href = url; a.download = `earthquake_data_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
    },

    /**
     * Ekspor data gunung api aktif (Waspada, Siaga, Awas) ke berkas CSV
     */
    exportVolcanoesToCSV() {
        const elevated = (App.State.volcanoes || []).filter(v => v.level >= 2);
        if (elevated.length === 0) return alert("Tidak ada data gunung api berstatus Waspada/Siaga/Awas.");
        
        let csv = "Nama,Status,Level,Provinsi,Elevasi_mdpl,Latitude,Longitude,Radius_Bahaya_km,Rekomendasi,Periode,URL_Laporan\n";
        elevated.forEach(v => {
            let nameStr = App.Utils.escapeHTML(v.nama).replace(/"/g, '""');
            let provStr = App.Utils.escapeHTML(v.provinsi).replace(/"/g, '""');
            let recStr = (v.rekomendasi ? App.Utils.escapeHTML(v.rekomendasi) : '').replace(/"/g, '""');
            let perStr = (v.periode ? App.Utils.escapeHTML(v.periode) : '').replace(/"/g, '""');
            csv += `"${nameStr}","${v.status}",${v.level},"${provStr}",${v.elevasi || ''},${v.lat},${v.lon},${v.radius_bahaya_km || ''},"${recStr}","${perStr}","${v.report_url}"\n`;
        });
        
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const a = document.createElement('a'); a.href = url; a.download = `gunung_api_aktif_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
    },

    /**
     * Mengambil status gunung api terkini (PVMBG MAGMA) dari cache lokal
     */
    async fetchVolcanoData(isManualSync = false) {
        const syncIcon = document.getElementById('volc-sync-icon');
        if (syncIcon) syncIcon.classList.add('fa-spin');
        try {
            const ts = Date.now();
            const response = await fetch(`${App.Config.VOLCANO_DATA_URL}?_t=${ts}`, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            const data = await response.json();
            
            App.State.volcanoes = data.volcanoes || [];
            App.State.volcanoStats = data.statistics || { awas: 0, siaga: 0, waspada: 0, normal: 0, total: 0 };
            App.State.volcanoLastUpdated = data.last_updated || '';
            
            App.UI.updateVolcanoUI();
            if (App.State.isVolcanoVisible) {
                App.Map.renderVolcanoMarkers();
            }

            if (isManualSync) {
                App.UI.showToast(`Data PVMBG tersinkron: ${App.State.volcanoStats.siaga} Siaga, ${App.State.volcanoStats.waspada} Waspada`);
            }
        } catch (err) {
            console.error("Gagal memuat data gunung api:", err);
            if (isManualSync) {
                App.UI.showToast("Gagal memuat data status gunung api.", "error");
            }
        } finally {
            if (syncIcon) syncIcon.classList.remove('fa-spin');
        }
    }
};
