/**
 * PANTAU GEMPA & GUNUNG BERAPI - UI Module
 * Handles DOM updates, charts, tables, modal dialogs, themes, and notifications.
 */

window.App = window.App || {};

App.UI = {
    chartInstance: null,

    toggleAboutModal(show, targetSectionId = null) {
        const modal = document.getElementById('about-modal');
        if (!modal) return;
        const mapContainer = document.querySelector('.map-container');
        const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
        
        if (show) {
            // CRITICAL FOR FULLSCREEN: If fullscreen is active, modal must be a child of fullscreen element to render in top-layer
            if (fsEl && !fsEl.contains(modal)) {
                fsEl.appendChild(modal);
            } else if (mapContainer && mapContainer.classList.contains('is-fullscreen') && !mapContainer.contains(modal)) {
                mapContainer.appendChild(modal);
            }

            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                const modalBody = modal.querySelector('div');
                if (modalBody) modalBody.classList.remove('scale-95');

                if (targetSectionId) {
                    const target = document.getElementById(targetSectionId);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            }, 25);
        } else {
            modal.classList.add('opacity-0');
            const modalBody = modal.querySelector('div');
            if (modalBody) modalBody.classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
                if (!document.fullscreenElement && !document.webkitFullscreenElement && modal.parentElement !== document.body) {
                    document.body.appendChild(modal);
                }
            }, 300);
        }
    },

    initChart() {
        const ctx = document.getElementById('magnitudeChart').getContext('2d');
        this.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['M < 4.0', 'M 4.0 - 4.9', 'M 5.0 - 5.9', 'M ≥ 6.0'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#38bdf8', '#facc15', '#f97316', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#475569', font: { size: 11 } } } }
            }
        });
    },

    toggleTheme() {
        App.State.isDarkMode = !App.State.isDarkMode;
        document.documentElement.classList.toggle('dark', App.State.isDarkMode);
        document.getElementById('theme-toggle-icon').className = App.State.isDarkMode ? 'fa-solid fa-sun text-amber-400 text-sm' : 'fa-solid fa-moon text-slate-700 text-sm';
        App.Map.updateTile();
        if (this.chartInstance) {
            this.chartInstance.options.plugins.legend.labels.color = App.State.isDarkMode ? '#94a3b8' : '#475569';
            this.chartInstance.update();
        }
    },

    toggleProviderSettings() {
        const provider = document.getElementById('api-provider').value;
        const regionContainer = document.getElementById('region-container');
        const timeContainer = document.getElementById('time-container');
        
        if (provider === 'USGS') {
            regionContainer.classList.remove('hidden');
            timeContainer.classList.remove('hidden');
            document.getElementById('active-source-text').innerText = 'Data Global USGS';
        } else {
            regionContainer.classList.add('hidden');
            timeContainer.classList.add('hidden');
            document.getElementById('custom-date-container').classList.add('hidden');
            document.getElementById('active-source-text').innerText = 'Data Terbuka BMKG';
        }
        App.Logic.fetchEarthquakeData();
    },

    handleTimeFilterChange() {
        const val = document.getElementById('time-filter').value;
        const customContainer = document.getElementById('custom-date-container');
        if (val === 'custom') {
            customContainer.classList.remove('hidden');
        } else {
            customContainer.classList.add('hidden');
            App.Logic.fetchEarthquakeData();
        }
    },

    updateSortIcons() {
        ['time', 'mag', 'depth'].forEach(col => {
            const icon = document.getElementById(`sort-icon-${col}`);
            if (!icon) return;
            if (App.State.sortConfig.column === col) {
                icon.className = App.State.sortConfig.direction === 'asc' 
                    ? 'fa-solid fa-arrow-up-wide-short text-indigo-600 dark:text-indigo-400 font-bold text-xs' 
                    : 'fa-solid fa-arrow-down-wide-short text-indigo-600 dark:text-indigo-400 font-bold text-xs';
            } else {
                icon.className = 'fa-solid fa-sort text-slate-400 text-[10px]';
            }
        });
    },

    updateLatestQuakeBanner() {
        const banner = document.getElementById('latest-quake-banner');
        if (!App.State.rawFetchedEarthquakes.length) return banner.classList.add('hidden');
        const latest = [...App.State.rawFetchedEarthquakes].sort((a, b) => b.time - a.time)[0];
        if (!latest) return banner.classList.add('hidden');
        
        banner.classList.remove('hidden');
        
        // SECURITY P0: Sanitasi teks
        const safePlace = App.Utils.escapeHTML(latest.place);
        const safeDepth = App.Utils.escapeHTML(latest.depth);

        document.getElementById('banner-mag').innerText = `M ${latest.mag.toFixed(1)}`;
        document.getElementById('banner-title').innerText = safePlace;
        document.getElementById('banner-full-time').innerText = latest.timeFormatted;
        document.getElementById('banner-depth').innerText = `${safeDepth} km`;
        
        const minMag = parseFloat(document.getElementById('mag-filter').value) || 0;
        const provider = document.getElementById('api-provider').value;
        const badge = document.getElementById('banner-badge');
        
        badge.innerText = provider === 'BMKG' ? "🔴 GEMPA BMKG TERBARU" : `🔴 GEMPA TERBARU (M ≥ ${minMag.toFixed(1)})`;
        
        const mmiWrapper = document.getElementById('banner-mmi-wrapper');
        mmiWrapper.classList.remove('hidden'); 
        
        // SEMANTICS P0: MMI vs CDI
        let intensityLabel = "Tidak ada laporan intensitas";
        if (latest.mmi) {
            intensityLabel = `MMI: ${App.Utils.escapeHTML(latest.mmi)}`;
            mmiWrapper.className = "text-rose-600 dark:text-rose-400 font-bold";
        } else if (latest.cdi) {
            intensityLabel = `CDI (DYFI): ${App.Utils.escapeHTML(latest.cdi)}`;
            mmiWrapper.className = "text-amber-600 dark:text-amber-400 font-medium";
        } else {
            mmiWrapper.className = "text-slate-500 dark:text-slate-400 font-medium text-xs";
        }
        
        document.getElementById('banner-mmi').innerText = intensityLabel;
        document.getElementById('banner-time-ago').innerText = App.Utils.formatTimeAgo(latest.time);
    },

    renderTable(dataToRender) {
        const tbody = document.getElementById('earthquake-table-body');
        tbody.innerHTML = ''; // Safe to reset container
        
        if (dataToRender.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                <i class="fa-solid fa-earth-americas text-3xl mb-3 block opacity-50"></i>
                Tidak ada data gempa di area layar peta ini.<br/>Geser peta (zoom out) atau kurangi filter Magnitudo.
            </td></tr>`;
            return;
        }

        dataToRender.forEach((eq) => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition cursor-pointer";
            let magColor = eq.mag >= 6.0 ? "text-rose-600 dark:text-rose-400 font-bold" : (eq.mag >= 4.5 ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-sky-600 dark:text-sky-400");
            
            // SECURITY P0: Sanitasi sebelum DOM insertion
            const safePlace = App.Utils.escapeHTML(eq.place);
            let mmiHTML = `<div class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5"><i class="fa-solid fa-house-crack mr-1"></i>Intensitas: - (Tidak ada laporan)</div>`;
            
            if (eq.mmi) {
                mmiHTML = `<div class="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-0.5 line-clamp-1" title="ShakeMap MMI"><i class="fa-solid fa-house-crack mr-1"></i>MMI: ${App.Utils.escapeHTML(eq.mmi)}</div>`;
            } else if (eq.cdi) {
                mmiHTML = `<div class="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 line-clamp-1" title="Community DYFI"><i class="fa-solid fa-house-crack mr-1"></i>CDI: ${App.Utils.escapeHTML(eq.cdi)}</div>`;
            }

            // InnerHTML safe because inputs are escaped
            tr.innerHTML = `
                <td class="p-3 whitespace-nowrap"><div class="font-medium text-slate-800 dark:text-slate-200">${eq.timeFormatted}</div><span class="text-[10px] text-slate-400">${App.Utils.escapeHTML(eq.source)}</span></td>
                <td class="p-3 font-mono ${magColor}">M ${eq.mag.toFixed(1)}</td>
                <td class="p-3 text-slate-600 dark:text-slate-300">${eq.depth} km</td>
                <td class="p-3">
                    <div class="line-clamp-1 font-medium text-slate-800 dark:text-slate-200" title="${safePlace}">${safePlace}</div>
                    ${mmiHTML}
                </td>
                <td class="p-3 text-center">
                    <button onclick="App.Map.focusOnLatLon(${eq.lat}, ${eq.lon})" class="p-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded-lg transition" title="Lihat Lokasi">
                        <i class="fa-solid fa-crosshairs"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    updateStats(dataToRender) {
        document.getElementById('stat-total').innerText = dataToRender.length;
        document.getElementById('result-count-badge').innerText = `${dataToRender.length} Data Area Ini`;
        if (dataToRender.length === 0) {
            document.getElementById('stat-max-mag').innerText = "0.0";
            document.getElementById('stat-max-depth').innerText = "0 km";
            document.getElementById('stat-latest-time').innerText = "--";
            return;
        }
        document.getElementById('stat-max-mag').innerText = Math.max(...dataToRender.map(e => e.mag)).toFixed(1);
        document.getElementById('stat-max-depth').innerText = `${Math.max(...dataToRender.map(e => e.depth))} km`;
        const latest = [...dataToRender].sort((a, b) => b.time - a.time)[0];
        document.getElementById('stat-latest-time').innerText = latest ? latest.timeFormatted : "--";
    },

    updateChart(dataToRender) {
        if (!this.chartInstance) return;
        let c = [0,0,0,0];
        dataToRender.forEach(eq => {
            if (eq.mag < 4.0) c[0]++; else if (eq.mag < 5.0) c[1]++; else if (eq.mag < 6.0) c[2]++; else c[3]++;
        });
        this.chartInstance.data.datasets[0].data = c;
        this.chartInstance.update();
    },

    updateVolcanoUI() {
        const stats = App.State.volcanoStats;
        const headerBadge = document.getElementById('volcano-header-badge');
        const headerText = document.getElementById('volcano-header-text');
        const activeBadge = document.getElementById('volcano-active-badge');
        
        const activeCount = (stats.awas || 0) + (stats.siaga || 0) + (stats.waspada || 0);
        
        if (headerText) {
            let text = `🌋 ${activeCount} Aktif`;
            if (stats.awas > 0) text = `🔴 ${stats.awas} Awas, ${stats.siaga} Siaga`;
            else if (stats.siaga > 0) text = `🟠 ${stats.siaga} Siaga, ${stats.waspada} Waspada`;
            headerText.innerText = text;
        }
        if (activeBadge) {
            activeBadge.innerText = activeCount;
        }
        if (headerBadge) {
            headerBadge.classList.remove('hidden');
        }

        // Update 4 stats card on the Volcano section
        const statAwas = document.getElementById('stat-awas-val');
        const statSiaga = document.getElementById('stat-siaga-val');
        const statWaspada = document.getElementById('stat-waspada-val');
        const statNormal = document.getElementById('stat-normal-val');
        if (statAwas) statAwas.innerText = stats.awas || 0;
        if (statSiaga) statSiaga.innerText = stats.siaga || 0;
        if (statWaspada) statWaspada.innerText = stats.waspada || 0;
        if (statNormal) statNormal.innerText = stats.normal || 0;

        // Update filter badge counts
        const countAll = (stats.awas || 0) + (stats.siaga || 0) + (stats.waspada || 0);
        const badgeAll = document.getElementById('volc-badge-all');
        const badgeAwas = document.getElementById('volc-badge-awas');
        const badgeSiaga = document.getElementById('volc-badge-siaga');
        const badgeWaspada = document.getElementById('volc-badge-waspada');
        if (badgeAll) badgeAll.innerText = countAll;
        if (badgeAwas) badgeAwas.innerText = stats.awas || 0;
        if (badgeSiaga) badgeSiaga.innerText = stats.siaga || 0;
        if (badgeWaspada) badgeWaspada.innerText = stats.waspada || 0;

        this.filterVolcanoTable();
    },

    setVolcanoStatusFilter(status) {
        App.State.volcanoStatusFilter = status;

        const btnAll = document.getElementById('volc-filter-all');
        const btnAwas = document.getElementById('volc-filter-awas');
        const btnSiaga = document.getElementById('volc-filter-siaga');
        const btnWaspada = document.getElementById('volc-filter-waspada');

        const inactiveBase = "px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer";

        if (btnAll) btnAll.className = inactiveBase + " hover:bg-slate-200 dark:hover:bg-slate-700";
        if (btnAwas) btnAwas.className = inactiveBase + " hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-300";
        if (btnSiaga) btnSiaga.className = inactiveBase + " hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950/40 dark:hover:text-orange-300";
        if (btnWaspada) btnWaspada.className = inactiveBase + " hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40 dark:hover:text-amber-300";

        if (status === 'all' && btnAll) {
            btnAll.className = "px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-xs cursor-pointer";
        } else if (status === 'awas' && btnAwas) {
            btnAwas.className = "px-2.5 py-1 rounded-lg text-[11px] font-black transition flex items-center gap-1.5 bg-rose-600 text-white shadow-xs border border-rose-600 cursor-pointer";
        } else if (status === 'siaga' && btnSiaga) {
            btnSiaga.className = "px-2.5 py-1 rounded-lg text-[11px] font-black transition flex items-center gap-1.5 bg-orange-500 text-white shadow-xs border border-orange-500 cursor-pointer";
        } else if (status === 'waspada' && btnWaspada) {
            btnWaspada.className = "px-2.5 py-1 rounded-lg text-[11px] font-black transition flex items-center gap-1.5 bg-amber-500 text-white shadow-xs border border-amber-500 cursor-pointer";
        }

        this.filterVolcanoTable();
    },

    renderVolcanoTable(dataToRender = null) {
        if (dataToRender === null) {
            this.filterVolcanoTable();
            return;
        }

        const tbody = document.getElementById('volcano-table-body');
        if (!tbody) return;
        
        const countBadge = document.getElementById('volcano-table-count-badge');
        if (countBadge) {
            countBadge.innerText = `${dataToRender.length} Gunung`;
        }
        
        tbody.innerHTML = '';
        
        if (dataToRender.length === 0) {
            const statusFilter = App.State.volcanoStatusFilter || 'all';
            let label = 'Waspada/Siaga/Awas';
            if (statusFilter === 'awas') label = 'Level IV (Awas)';
            else if (statusFilter === 'siaga') label = 'Level III (Siaga)';
            else if (statusFilter === 'waspada') label = 'Level II (Waspada)';

            tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                <i class="fa-solid fa-volcano text-3xl mb-3 block opacity-50"></i>
                Tidak ada data gunung api berstatus <strong>${label}</strong> yang cocok dengan kriteria pencarian.
            </td></tr>`;
            return;
        }
        
        // Urutkan dari level tertinggi (Level 4 Awas -> Level 3 Siaga -> Level 2 Waspada) lalu nama
        const sorted = [...dataToRender].sort((a, b) => (b.level - a.level) || a.nama.localeCompare(b.nama));
        
        sorted.forEach(v => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition";
            
            let statusBadge = '';
            if (v.level === 4) {
                statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black bg-rose-600 text-white shadow-xs whitespace-nowrap"><i class="fa-solid fa-radiation animate-bounce"></i> AWAS (LVL IV)</span>`;
            } else if (v.level === 3) {
                statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black bg-orange-500 text-white shadow-xs whitespace-nowrap"><i class="fa-solid fa-volcano"></i> SIAGA (LVL III)</span>`;
            } else {
                statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-500 text-white shadow-xs whitespace-nowrap"><i class="fa-solid fa-triangle-exclamation"></i> WASPADA (LVL II)</span>`;
            }
            
            const safeName = App.Utils.escapeHTML(v.nama);
            const safeProv = App.Utils.escapeHTML(v.provinsi);
            const radiusText = v.radius_bahaya_km ? `<span class="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900/60 text-[11px] whitespace-nowrap">±${v.radius_bahaya_km} km</span>` : `<span class="text-slate-400 font-medium">-</span>`;
            const safeRec = v.rekomendasi ? App.Utils.escapeHTML(v.rekomendasi) : 'Ikuti arahan pos pengamatan PVMBG setempat.';
            
            tr.innerHTML = `
                <td class="p-3 align-middle">
                    ${statusBadge}
                </td>
                <td class="p-3 align-middle">
                    <div class="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-1.5">
                        <i class="fa-solid fa-mountain text-amber-500 text-[10px]"></i> ${safeName}
                    </div>
                    <div class="text-[10px] text-slate-400 mt-0.5">
                        ${v.elevasi ? `${v.elevasi} mdpl` : ''}
                    </div>
                </td>
                <td class="p-3 align-middle text-slate-700 dark:text-slate-300 font-medium text-xs">
                    ${safeProv}
                </td>
                <td class="p-3 align-middle">
                    ${radiusText}
                </td>
                <td class="p-3 align-middle text-slate-600 dark:text-slate-400 text-[11px] max-w-xs sm:max-w-sm">
                    <div class="line-clamp-2" title="${safeRec}">${safeRec}</div>
                    <div class="mt-1">
                        <a href="${v.report_url}" target="_blank" rel="noopener" class="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold inline-flex items-center gap-1 text-[10px]">
                            <span>Laporan Detail PVMBG</span> <i class="fa-solid fa-arrow-up-right-from-square text-[8px]"></i>
                        </a>
                    </div>
                </td>
                <td class="p-3 align-middle text-center">
                    <button onclick="App.Map.focusVolcano('${v.id}')" class="p-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 rounded-xl transition font-semibold text-xs flex items-center gap-1 mx-auto cursor-pointer" title="Pusatkan peta dan buka popup info gunung ini">
                        <i class="fa-solid fa-crosshairs text-xs"></i>
                        <span class="hidden xl:inline text-[11px]">Peta</span>
                    </button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
    },

    filterVolcanoTable() {
        const input = document.getElementById('volcano-search-input');
        const query = (input ? input.value : '').toLowerCase().trim();
        const statusFilter = App.State.volcanoStatusFilter || 'all';

        // 1. Saring berdasarkan status terpilih (Awas, Siaga, Waspada, atau Semua)
        let list = (App.State.volcanoes || []).filter(v => {
            if (statusFilter === 'awas') return v.level === 4;
            if (statusFilter === 'siaga') return v.level === 3;
            if (statusFilter === 'waspada') return v.level === 2;
            return v.level >= 2; // default: elevated (Waspada, Siaga, Awas)
        });
        
        // 2. Saring teks pencarian (nama, provinsi, status)
        if (query) {
            list = list.filter(v => {
                return (v.nama && v.nama.toLowerCase().includes(query)) ||
                       (v.provinsi && v.provinsi.toLowerCase().includes(query)) ||
                       (v.status && v.status.toLowerCase().includes(query)) ||
                       (v.level_text && v.level_text.toLowerCase().includes(query));
            });
        }
        
        this.renderVolcanoTable(list);
    },

    showToast(message, type = 'success') {
        let toast = document.getElementById('app-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'app-toast';
            document.body.appendChild(toast);
        }
        const iconClass = type === 'error' ? 'fa-triangle-exclamation text-rose-300' : 'fa-circle-check text-emerald-400';
        toast.className = `fixed bottom-5 right-5 z-[9999] px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2.5 transition-all duration-300 pointer-events-none ${type === 'error' ? 'bg-rose-700 text-white' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'}`;
        toast.innerHTML = `<i class="fa-solid ${iconClass} text-sm"></i> <span>${App.Utils.escapeHTML(message)}</span>`;
        
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(16px)';
        }, 3500);
    }
};
