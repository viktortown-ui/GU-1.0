// Утилита для работы с localStorage
class Storage {
    static KEY = 'premortem-hub';

    static load() {
        try {
            const data = localStorage.getItem(this.KEY);
            const parsed = data ? JSON.parse(data) : { projects: [] };
            const normalized = this.normalizeData(parsed);
            if (normalized.changed) {
                this.save(normalized.data);
            }
            return normalized.data;
        } catch (e) {
            console.error('Ошибка загрузки данных:', e);
            return { projects: [] };
        }
    }

    static save(data) {
        try {
            localStorage.setItem(this.KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Ошибка сохранения данных:', e);
            return false;
        }
    }

    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static getProject(id) {
        const data = this.load();
        const project = data.projects.find(p => p.id === id);
        if (!project) return null;
        const normalized = this.normalizeProject(project);
        return normalized.project;
    }

    static saveProject(project) {
        const data = this.load();
        const normalized = this.normalizeProject(project);
        const index = data.projects.findIndex(p => p.id === normalized.project.id);

        if (index >= 0) {
            data.projects[index] = { ...normalized.project, updatedAt: new Date().toISOString() };
        } else {
            data.projects.push({ ...normalized.project, createdAt: new Date().toISOString() });
        }

        return this.save(data);
    }

    static deleteProject(id) {
        const data = this.load();
        data.projects = data.projects.filter(p => p.id !== id);
        return this.save(data);
    }

    static duplicateProject(id) {
        const data = this.load();
        const project = data.projects.find(p => p.id === id);
        if (!project) return null;

        const duplicate = {
            ...JSON.parse(JSON.stringify(project)),
            id: this.generateId(),
            name: project.name + ' (копия)',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        data.projects.push(duplicate);
        this.save(data);
        return duplicate;
    }

    static createProject(name, description = '') {
        const id = this.generateId();
        const now = new Date().toISOString();
        const base = this.defaultProject();

        return {
            ...base,
            id,
            name,
            description,
            createdAt: now,
            updatedAt: now
        };
    }

    static normalizeData(raw) {
        const projects = Array.isArray(raw?.projects) ? raw.projects : [];
        let changed = !Array.isArray(raw?.projects);

        const normalizedProjects = projects.map((project) => {
            const normalized = this.normalizeProject(project);
            if (normalized.changed) changed = true;
            return normalized.project;
        });

        return {
            data: { projects: normalizedProjects },
            changed
        };
    }

    static defaultProject() {
        return {
            id: '',
            name: '',
            description: '',
            createdAt: '',
            updatedAt: '',
            premortem: {
                client: '',
                problem: '',
                solution: '',
                format: '',
                oneLiners: ['', '', ''],
                selectedOneLiner: 0,
                economics: {
                    price: { min: 0, typ: 0, max: 0 },
                    demand: { min: 0, typ: 0, max: 0 },
                    expenses: { min: 0, typ: 0, max: 0 }
                },
                fogi: {
                    checklist: this.defaultFogChecklist(),
                    percentage: 100
                },
                illi: {
                    anomalies: this.defaultIlliChecklist()
                },
                verdict: {
                    status: 'review',
                    reason: 'Требуется анализ'
                },
                plan: []
            },
            segments: {
                segments: []
            },
            operations: {
                scenarios: []
            },
            portfolio: {
                ideas: [],
                simulation: { n: 500, var: 0, cvar: 0, portfolioIndex: 0 }
            }
        };
    }

    static defaultFogChecklist() {
        return [
            { id: 1, text: 'Понятен ли клиент и его проблема?', checked: false },
            { id: 2, text: 'Решает ли решение проблему клиента?', checked: false },
            { id: 3, text: 'Готов ли клиент платить?', checked: false },
            { id: 4, text: 'Понятен ли формат поставки?', checked: false },
            { id: 5, text: 'Известны ли конкуренты?', checked: false },
            { id: 6, text: 'Понятны ли каналы привлечения?', checked: false },
            { id: 7, text: 'Оценены ли расходы на запуск?', checked: false },
            { id: 8, text: 'Оценены ли операционные расходы?', checked: false }
        ];
    }

    static defaultIlliChecklist() {
        return [
            { id: 1, text: 'Аномальный рост спроса', active: false },
            { id: 2, text: 'Резкое падение цен', active: false },
            { id: 3, text: 'Появление сильного конкурента', active: false },
            { id: 4, text: 'Изменение регуляции', active: false }
        ];
    }

    static normalizeProject(project) {
        const safe = (value, fallback = 0) => {
            if (window.NumberUtils) return NumberUtils.safeNumber(value, fallback);
            const num = Number(value);
            return Number.isFinite(num) ? num : fallback;
        };

        const base = this.defaultProject();
        const current = project && typeof project === 'object' ? project : {};
        let changed = false;

        const premortem = current.premortem || {};
        const economics = premortem.economics || {};
        const price = economics.price || {};
        const demand = economics.demand || {};
        const expenses = economics.expenses || {};

        const baseChecklist = this.defaultFogChecklist();
        const existingChecklist = Array.isArray(premortem.fogi?.checklist) ? premortem.fogi.checklist : [];
        const checklistMap = new Map(existingChecklist.map(item => [item.id, item]));
        const mergedChecklist = baseChecklist.map(item => {
            const existing = checklistMap.get(item.id);
            return {
                id: item.id,
                text: (existing?.text || item.text).trim(),
                checked: !!existing?.checked
            };
        });

        const baseIlli = this.defaultIlliChecklist();
        const existingIlli = Array.isArray(premortem.illi?.anomalies) ? premortem.illi.anomalies : [];
        const illiMap = new Map(existingIlli.map(item => [item.id, item]));
        const mergedIlli = baseIlli.map(item => {
            const existing = illiMap.get(item.id);
            return {
                id: item.id,
                text: (existing?.text || item.text).trim(),
                active: !!existing?.active
            };
        });

        const normalizedPlan = Array.isArray(premortem.plan)
            ? premortem.plan.map((step, idx) => ({
                id: Number.isFinite(step?.id) ? step.id : idx + 1,
                step: String(step?.step ?? '').trim(),
                duration: safe(step?.duration, 7)
            })).filter(step => step.step.length > 0)
            : [];

        const segments = Array.isArray(current.segments?.segments)
            ? current.segments.segments.map((segment, idx) => ({
                id: Number.isFinite(segment?.id) ? segment.id : idx + 1,
                name: String(segment?.name ?? '').trim() || `Сегмент ${idx + 1}`,
                volume: safe(segment?.volume, 0),
                frequency: safe(segment?.frequency, 1),
                checked: segment?.checked !== false,
                metrics: {
                    accessibility: NumberUtils ? NumberUtils.clamp(segment?.metrics?.accessibility, 1, 5, 3) : safe(segment?.metrics?.accessibility, 3),
                    willingness: NumberUtils ? NumberUtils.clamp(segment?.metrics?.willingness, 1, 5, 3) : safe(segment?.metrics?.willingness, 3),
                    pain: NumberUtils ? NumberUtils.clamp(segment?.metrics?.pain, 1, 5, 3) : safe(segment?.metrics?.pain, 3),
                    reach: NumberUtils ? NumberUtils.clamp(segment?.metrics?.reach, 1, 5, 3) : safe(segment?.metrics?.reach, 3)
                },
                index: safe(segment?.index, 0)
            }))
            : [];

        const scenarios = Array.isArray(current.operations?.scenarios)
            ? current.operations.scenarios.map((scenario, idx) => ({
                id: Number.isFinite(scenario?.id) ? scenario.id : idx + 1,
                name: String(scenario?.name ?? '').trim() || `Сценарий ${idx + 1}`,
                demand: safe(scenario?.demand, 0),
                resources: Array.isArray(scenario?.resources)
                    ? scenario.resources.map((resource, rIdx) => ({
                        name: String(resource?.name ?? '').trim() || `Ресурс ${rIdx + 1}`,
                        capacity: safe(resource?.capacity, 0),
                        reliability: NumberUtils ? NumberUtils.clamp(resource?.reliability, 0, 1, 0.95) : safe(resource?.reliability, 0.95)
                    }))
                    : []
            }))
            : [];

        const ideas = Array.isArray(current.portfolio?.ideas)
            ? current.portfolio.ideas.map((idea, idx) => {
                const revenue = idea?.revenue || {};
                const typical = revenue.typical ?? revenue.base ?? 0;
                return {
                    id: Number.isFinite(idea?.id) ? idea.id : idx + 1,
                    name: String(idea?.name ?? '').trim() || `Идея ${idx + 1}`,
                    revenue: {
                        base: safe(revenue.base ?? typical, 0),
                        typical: safe(typical, 0),
                        pessimistic: safe(revenue.pessimistic, 0),
                        optimistic: safe(revenue.optimistic, 0)
                    },
                    risk: NumberUtils ? NumberUtils.clamp(idea?.risk, 0, 1, 0.3) : safe(idea?.risk, 0.3),
                    load: NumberUtils ? NumberUtils.clamp(idea?.load, 0, 1, 0.5) : safe(idea?.load, 0.5),
                    time: NumberUtils ? Math.max(1, safe(idea?.time, 6)) : safe(idea?.time, 6),
                    money: safe(idea?.money, 0),
                    weight: NumberUtils ? NumberUtils.clamp(idea?.weight, 0, 1, 0.5) : safe(idea?.weight, 0.5),
                    index: safe(idea?.index, 0)
                };
            })
            : [];

        const normalized = {
            ...base,
            id: current.id || base.id,
            name: String(current.name ?? base.name),
            description: String(current.description ?? base.description),
            createdAt: current.createdAt || base.createdAt,
            updatedAt: current.updatedAt || base.updatedAt,
            premortem: {
                ...base.premortem,
                client: String(premortem.client ?? base.premortem.client),
                problem: String(premortem.problem ?? base.premortem.problem),
                solution: String(premortem.solution ?? base.premortem.solution),
                format: String(premortem.format ?? base.premortem.format),
                oneLiners: Array.isArray(premortem.oneLiners) && premortem.oneLiners.length
                    ? premortem.oneLiners.map(item => String(item ?? ''))
                    : base.premortem.oneLiners,
                selectedOneLiner: Number.isFinite(premortem.selectedOneLiner)
                    ? premortem.selectedOneLiner
                    : base.premortem.selectedOneLiner,
                economics: {
                    price: {
                        min: safe(price.min, 0),
                        typ: safe(price.typ, 0),
                        max: safe(price.max, 0)
                    },
                    demand: {
                        min: safe(demand.min, 0),
                        typ: safe(demand.typ, 0),
                        max: safe(demand.max, 0)
                    },
                    expenses: {
                        min: safe(expenses.min, 0),
                        typ: safe(expenses.typ, 0),
                        max: safe(expenses.max, 0)
                    }
                },
                fogi: {
                    checklist: mergedChecklist,
                    percentage: NumberUtils ? NumberUtils.clamp(premortem.fogi?.percentage, 0, 100, 100) : safe(premortem.fogi?.percentage, 100)
                },
                illi: {
                    anomalies: mergedIlli
                },
                verdict: {
                    status: premortem.verdict?.status || base.premortem.verdict.status,
                    reason: String(premortem.verdict?.reason ?? base.premortem.verdict.reason)
                },
                plan: normalizedPlan
            },
            segments: { segments },
            operations: { scenarios },
            portfolio: {
                ideas,
                simulation: {
                    n: safe(current.portfolio?.simulation?.n, 500),
                    var: safe(current.portfolio?.simulation?.var, 0),
                    cvar: safe(current.portfolio?.simulation?.cvar, 0),
                    portfolioIndex: safe(current.portfolio?.simulation?.portfolioIndex, 0),
                    mean: safe(current.portfolio?.simulation?.mean, 0),
                    std: safe(current.portfolio?.simulation?.std, 0)
                }
            }
        };

        if (!current.id || !current.premortem || !current.segments || !current.operations || !current.portfolio) {
            changed = true;
        }

        return { project: normalized, changed };
    }
}

// Экспорт для использования в других модулях
window.Storage = Storage;
