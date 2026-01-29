// Утилита с расчетными формулами
class Calculators {
    // ---------- Premortem Lite ----------

    // Расчет сценариев прибыли (P = (Price - Expenses) * Demand)
    static calculateProfitScenarios(economics) {
        const safe = (v) => (Number.isFinite(v) ? v : 0);
        const price = economics?.price || { min: 0, typ: 0, max: 0 };
        const demand = economics?.demand || { min: 0, typ: 0, max: 0 };
        const expenses = economics?.expenses || { min: 0, typ: 0, max: 0 };

        return {
            pessimistic: (safe(price.min) - safe(expenses.max)) * safe(demand.min),
            typical: (safe(price.typ) - safe(expenses.typ)) * safe(demand.typ),
            optimistic: (safe(price.max) - safe(expenses.min)) * safe(demand.max)
        };
    }

    // FogI (доля неизвестного)
    static calculateFogI(checklist) {
        if (!Array.isArray(checklist) || checklist.length === 0) return 0;
        const unchecked = checklist.filter(item => !item.checked).length;
        return Math.round((unchecked / checklist.length) * 100);
    }

    // Вердикт
    static calculateVerdict(profitScenarios, fogI, illI) {
        const safe = (v) => (Number.isFinite(v) ? v : 0);
        const p = profitScenarios || { pessimistic: 0, typical: 0, optimistic: 0 };
        const avgProfit = (safe(p.pessimistic) + safe(p.typical) + safe(p.optimistic)) / 3;

        // Простые правила (можно расширять позже)
        if (fogI > 60) return { status: 'pause', reason: 'Слишком много неизвестных (>60%)' };
        if (avgProfit < 0) return { status: 'kill', reason: 'Отрицательная прибыль' };
        if (fogI > 40) return { status: 'review', reason: 'Много неизвестных (>40%)' };
        if (illI > 2) return { status: 'review', reason: 'Есть аномалии' };
        return { status: 'proceed', reason: 'Все показатели в норме' };
    }

    // ---------- Segments ----------

    static calculateSegmentIndex(segment) {
        if (!segment || !segment.checked) return 0;

        const m = segment.metrics || {};
        const avgMetrics = (
            (m.accessibility ?? 0) +
            (m.willingness ?? 0) +
            (m.pain ?? 0) +
            (m.reach ?? 0)
        ) / 4;

        const volume = Number.isFinite(segment.volume) ? segment.volume : 0;
        const frequency = Number.isFinite(segment.frequency) ? segment.frequency : 0;

        // Небольшие ограничители, чтобы индекс не улетал в космос
        const volumeFactor = Math.min(volume / 1000, 2);
        const frequencyFactor = Math.min(frequency / 12, 2);

        return Math.round(avgMetrics * volumeFactor * frequencyFactor * 10);
    }

    // ---------- Operations (очереди) ----------

    // M/M/1 приближение (очень грубо, но полезно как сигнал)
    static calculateQueueMetrics(demand, resources) {
        const res = Array.isArray(resources) ? resources : [];
        const safe = (v) => (Number.isFinite(v) ? v : 0);

        const totalCapacity = res.reduce((sum, r) => {
            const cap = safe(r?.capacity);
            const rel = Number.isFinite(r?.reliability) ? r.reliability : 1;
            return sum + cap * Math.max(0, Math.min(rel, 1));
        }, 0);

        if (totalCapacity <= 0) {
            return { rho: Infinity, wq: Infinity };
        }

        const lambda = safe(demand);
        const rho = lambda / totalCapacity;

        if (rho >= 1) {
            return { rho: Math.round(rho * 100) / 100, wq: Infinity };
        }

        const mu = totalCapacity;
        const wq = (rho * rho) / (2 * mu * (1 - rho));

        return {
            rho: Math.round(rho * 100) / 100,
            wq: Math.round(wq * 100) / 100
        };
    }

    static calculateOperationsIndex(scenario) {
        const demand = scenario?.demand ?? 0;
        const resources = scenario?.resources ?? [];
        const { rho, wq } = this.calculateQueueMetrics(demand, resources);

        const res = Array.isArray(resources) ? resources : [];
        const avgReliability = res.length
            ? res.reduce((sum, r) => sum + (Number.isFinite(r?.reliability) ? r.reliability : 1), 0) / res.length
            : 0;

        if (rho === Infinity || wq === Infinity || res.length === 0) return 0;

        // Чем ниже загрузка и ожидание, тем лучше
        const rhoScore = Math.max(0, (1 - rho) * 50);
        const wqScore = Math.max(0, (1 - Math.min(wq / 10, 1)) * 50);
        const reliabilityScore = Math.max(0, Math.min(avgReliability, 1)) * 50;

        return Math.round((rhoScore + wqScore + reliabilityScore) / 1.5);
    }

    // ---------- Portfolio (Monte-Carlo) ----------

    static _triangular(min, mode, max) {
        // защищаемся от мусора
        const a = Number.isFinite(min) ? min : 0;
        const b = Number.isFinite(mode) ? mode : 0;
        const c = Number.isFinite(max) ? max : 0;

        // если заданы криво — сортируем
        const lo = Math.min(a, b, c);
        const hi = Math.max(a, b, c);
        const md = Math.min(Math.max(b, lo), hi);

        if (hi === lo) return lo;

        const u = Math.random();
        const f = (md - lo) / (hi - lo);
        if (u < f) {
            return lo + Math.sqrt(u * (hi - lo) * (md - lo));
        }
        return hi - Math.sqrt((1 - u) * (hi - lo) * (hi - md));
    }

    static simulatePortfolio(portfolio, n = 500) {
        const ideas = Array.isArray(portfolio?.ideas) ? portfolio.ideas : [];
        const N = Math.max(10, Math.min(Number.isFinite(n) ? n : 500, 10000));

        if (ideas.length === 0) {
            return { var: 0, cvar: 0, mean: 0, std: 0 };
        }

        const results = [];

        for (let i = 0; i < N; i++) {
            let total = 0;

            for (const idea of ideas) {
                const rev = idea?.revenue || {};

                // В UI сейчас: base / pessimistic / optimistic.
                // mode = base (типичный).
                const pessimistic = rev.pessimistic ?? 0;
                const typical = (rev.typical ?? rev.base ?? 0);
                const optimistic = rev.optimistic ?? 0;

                let revenue = this._triangular(pessimistic, typical, optimistic);

                // риск 0..1 (как в UI)
                const risk = Number.isFinite(idea?.risk) ? Math.max(0, Math.min(idea.risk, 1)) : 0;
                revenue *= (1 - risk);

                const weight = Number.isFinite(idea?.weight) ? Math.max(0, idea.weight) : 1;
                total += revenue * weight;
            }

            results.push(total);
        }

        results.sort((a, b) => a - b);

        const mean = results.reduce((s, v) => s + v, 0) / N;
        const variance = results.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / N;
        const std = Math.sqrt(variance);

        const tailCount = Math.max(1, Math.floor(N * 0.05));
        const var95 = results[tailCount - 1];
        const cvar95 = results.slice(0, tailCount).reduce((s, v) => s + v, 0) / tailCount;

        return {
            var: Math.round(var95),
            cvar: Math.round(cvar95),
            mean: Math.round(mean),
            std: Math.round(std)
        };
    }

    static calculatePortfolioIndex(portfolio) {
        const ideas = Array.isArray(portfolio?.ideas) ? portfolio.ideas : [];
        if (ideas.length === 0) return 0;

        const simulation = this.simulatePortfolio(portfolio);

        const avgRisk = ideas.reduce((sum, idea) => sum + (Number.isFinite(idea?.risk) ? idea.risk : 0), 0) / ideas.length;
        const avgLoad = ideas.reduce((sum, idea) => sum + (Number.isFinite(idea?.load) ? idea.load : 0), 0) / ideas.length;
        const avgTime = ideas.reduce((sum, idea) => sum + (Number.isFinite(idea?.time) ? idea.time : 0), 0) / ideas.length;

        const revenueScore = Math.min(Math.max((simulation.mean / 100000) * 30, 0), 30);
        const riskScore = Math.max(0, (1 - avgRisk) * 25);
        const efficiencyScore = Math.max(0, (1 - avgLoad) * 20);
        const timeScore = Math.max(0, (1 - Math.min(avgTime / 12, 1)) * 15);
        const varScore = simulation.var >= 0 ? 10 : Math.max(0, (1 - Math.abs(simulation.var) / 100000) * 10);

        return Math.round(revenueScore + riskScore + efficiencyScore + timeScore + varScore);
    }
}

// Экспорт для использования в других модулях
window.Calculators = Calculators;
