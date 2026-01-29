// Универсальные числовые утилиты для защиты от NaN/Infinity
class NumberUtils {
    static safeNumber(value, fallback = 0) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    static clamp(value, min = 0, max = 1, fallback = null) {
        const safeFallback = fallback === null ? min : fallback;
        const num = this.safeNumber(value, safeFallback);
        return Math.min(max, Math.max(min, num));
    }

    static toFloatOrNull(value) {
        if (value === null || value === undefined) return null;
        const raw = String(value).trim();
        if (!raw) return null;
        const num = Number(raw.replace(',', '.'));
        return Number.isFinite(num) ? num : null;
    }

    static formatNumber(value, options = {}) {
        const num = Number(value);
        if (!Number.isFinite(num)) return options.fallback ?? '—';
        return num.toLocaleString('ru-RU', options);
    }
}

window.NumberUtils = NumberUtils;
