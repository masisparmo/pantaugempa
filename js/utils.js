/**
 * @file utils.js
 * @description Helper utilities: XSS sanitization, formatting, and Roman numeral converters
 */

window.App = window.App || {};

App.Utils = {
    /**
     * SECURITY: Sanitasi input HTML untuk mencegah serangan XSS
     * @param {string} str
     * @returns {string}
     */
    escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag] || tag));
    },

    /**
     * Mengubah nilai float MMI ke format angka Romawi I - XII
     * @param {number} mmi
     * @returns {string|null}
     */
    getMMIRoman(mmi) {
        if (!mmi) return null;
        const val = Math.round(mmi);
        const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        return roman[val - 1] || 'XII';
    },

    /**
     * Memformat timestamp millisecond ke format relatif ramah pengguna (contoh: "5 mnt lalu")
     * @param {number} timeMs
     * @returns {string}
     */
    formatTimeAgo(timeMs) {
        const diffMin = Math.floor((Date.now() - timeMs) / 60000);
        return diffMin < 60 ? `${Math.max(1, diffMin)} mnt lalu` : (diffMin < 1440 ? `${Math.floor(diffMin/60)} jam lalu` : `${Math.floor(diffMin/1440)} hr lalu`);
    }
};
