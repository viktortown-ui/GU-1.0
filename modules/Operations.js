// Модуль Операционная устойчивость
class Operations {
    constructor(project) {
        this.project = project;
        this.nextId = this.getNextId();

        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
    }

    getNextId() {
        if (!this.project.operations || !this.project.operations.scenarios) return 1;
        return Math.max(...this.project.operations.scenarios.map(s => s.id), 0) + 1;
    }

    bindEvents() {
        const addBtn = document.getElementById('addScenario');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addScenario());
        }
    }

    render() {
        this.renderScenariosList();
        this.updateOperationsIndex();
    }

    renderScenariosList() {
        const container = document.getElementById('scenariosList');
        const scenarios = this.project.operations?.scenarios || [];

        if (!container) return;

        if (scenarios.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-cogs text-4xl mb-4"></i>
                    <p>Нет сценариев. Добавьте первый сценарий для анализа операционной устойчивости.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = scenarios.map(scenario => this.renderScenarioCard(scenario)).join('');
        this.bindScenarioEvents();
    }

    renderScenarioCard(scenario) {
        const metrics = Calculators.calculateQueueMetrics(scenario.demand, scenario.resources);
        const index = Calculators.calculateOperationsIndex(scenario);
        const rhoClass = this.getRhoBadgeClass(metrics.rho);
        const rhoValue = metrics.rho === Infinity ? '∞' : metrics.rho;
        const wqValue = metrics.wq === Infinity ? '∞' : metrics.wq;
        const rhoPercent = this.getRhoPercent(metrics.rho);
        const wqPercent = this.getWqPercent(metrics.wq);
        const indexPercent = this.getIndexPercent(index);

        return `
            <div class="bg-white border border-gray-200 rounded-lg p-6 space-y-6 scenario-card" data-scenario-id="${scenario.id}">
                <div class="scenario-card__header flex items-start justify-between gap-4">
                    <input
                        type="text"
                        class="scenario-name scenario-title flex-1 text-lg font-semibold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                        value="${scenario.name || 'Новый сценарий'}"
                        onchange="app.modules.operations.updateScenario(${scenario.id}, 'name', this.value)"
                    />
                    <button
                        onclick="app.modules.operations.deleteScenario(${scenario.id})"
                        class="scenario-delete px-3 py-2 rounded-lg border border-red-200 text-red-500 hover:text-red-700 hover:border-red-300 transition-colors"
                        title="Удалить сценарий"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </div>

                <div class="scenario-section bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-medium text-gray-900 flex items-center gap-2">Вводы ${this.renderHint('Сколько заявок приходит в час. Можно грубо.')}</h4>
                    </div>
                    <div class="flex flex-col md:flex-row md:items-center md:space-x-4 gap-3">
                        <label class="text-sm text-gray-600 w-full md:w-32">Заявки/час:</label>
                        <input
                            type="number"
                            class="scenario-demand w-full md:flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value="${NumberUtils.safeNumber(scenario.demand, 0)}"
                            min="0"
                            step="0.1"
                            onchange="app.modules.operations.updateScenario(${scenario.id}, 'demand', NumberUtils.toFloatOrNull(this.value))"
                        />
                    </div>
                </div>

                <div class="scenario-section bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-medium text-gray-900">Ресурсы</h4>
                        <button
                            onclick="app.modules.operations.addResource(${scenario.id})"
                            class="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <i class="fas fa-plus mr-1"></i>Добавить
                        </button>
                    </div>

                    <div class="space-y-3">
                        ${scenario.resources.map((resource, index) => this.renderResourceRow(scenario.id, resource, index)).join('')}
                    </div>
                </div>

                <div class="scenario-results bg-white border border-gray-200 rounded-lg p-4">
                    <h4 class="font-medium text-gray-900 mb-3">Результаты</h4>
                    <div class="results-chips flex flex-wrap gap-2">
                        <span class="metric-badge metric-rho ${rhoClass}">
                            <span class="metric-label">ρ: ${rhoValue}</span>
                            <span class="mini-progress" role="img" aria-label="Загрузка ${rhoValue}">
                                <span class="mini-progress__fill" style="width: ${rhoPercent}%;"></span>
                            </span>
                        </span>
                        <span class="metric-badge metric-wq">
                            <span class="metric-label">Wq: ${wqValue}</span>
                            <span class="mini-progress" role="img" aria-label="Ожидание ${wqValue}" title="Относительный индикатор ожидания: чем меньше — тем лучше">
                                <span class="mini-progress__fill" style="width: ${wqPercent}%;"></span>
                            </span>
                        </span>
                        <span class="metric-badge metric-index">
                            <span class="metric-label">Индекс: ${index}</span>
                            <span class="mini-progress" role="img" aria-label="Индекс устойчивости ${index}">
                                <span class="mini-progress__fill" style="width: ${indexPercent}%;"></span>
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    renderResourceRow(scenarioId, resource, index) {
        return `
            <div class="resource-card p-3 bg-white border border-gray-200 rounded-lg">
                <div class="resource-card__header flex items-start gap-2">
                    <input
                        type="text"
                        class="resource-name w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Название ресурса"
                        value="${resource.name || ''}"
                        onchange="app.modules.operations.updateResource(${scenarioId}, ${index}, 'name', this.value)"
                    />
                    <button
                        onclick="app.modules.operations.removeResource(${scenarioId}, ${index})"
                        class="resource-delete rounded-lg border border-red-200 text-red-500 hover:text-red-700 hover:border-red-300 transition-colors"
                        title="Удалить ресурс"
                    >
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
                <div class="resource-card__metrics resource-metrics-grid mt-3">
                    <label class="resource-field text-xs text-gray-600">
                        Мощность
                        <input
                            type="number"
                            class="resource-capacity w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value="${NumberUtils.safeNumber(resource.capacity, 0)}"
                            min="0"
                            step="0.1"
                            onchange="app.modules.operations.updateResource(${scenarioId}, ${index}, 'capacity', NumberUtils.toFloatOrNull(this.value))"
                        />
                    </label>
                    <label class="resource-field text-xs text-gray-600">
                        Надежность
                        <input
                            type="number"
                            class="resource-reliability w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value="${NumberUtils.clamp(resource.reliability, 0, 1, 0.95)}"
                            min="0"
                            max="1"
                            step="0.01"
                            onchange="app.modules.operations.updateResource(${scenarioId}, ${index}, 'reliability', NumberUtils.toFloatOrNull(this.value))"
                        />
                    </label>
                </div>
            </div>
        `;
    }

    renderHint(text) {
        return `<button type="button" class="hint" data-tooltip="${this.esc(text)}" aria-label="${this.esc(text)}">i</button>`;
    }

    bindScenarioEvents() {
        // Events are bound through inline handlers
    }

    addScenario() {
        const scenarios = this.project.operations?.scenarios || [];
        const newScenario = {
            id: this.nextId++,
            name: `Сценарий ${scenarios.length + 1}`,
            demand: 100,
            resources: [
                { name: 'Основной ресурс', capacity: 120, reliability: 0.95 }
            ]
        };

        scenarios.push(newScenario);

        if (!this.project.operations) {
            this.project.operations = { scenarios: [] };
        }
        this.project.operations.scenarios = scenarios;

        this.render();
        if (window.app) window.app.persistProject(true);
    }

    deleteScenario(id) {
        const scenario = this.findScenario(id);
        const name = scenario?.name ? ` «${scenario.name}»` : '';
        if (!confirm(`Удалить сценарий${name}?`)) return;

        const scenarios = this.project.operations?.scenarios || [];
        this.project.operations.scenarios = scenarios.filter(s => s.id !== id);
        this.render();
        if (window.app) window.app.persistProject(true);
    }

    updateScenario(id, field, value) {
        const scenario = this.findScenario(id);
        if (scenario) {
            if (field === 'name') {
                scenario[field] = String(value || '').trim();
            } else {
                scenario[field] = NumberUtils.safeNumber(value, 0);
            }
            this.render();
            if (window.app) window.app.persistProject(true);
        }
    }

    addResource(scenarioId) {
        const scenario = this.findScenario(scenarioId);
        if (scenario) {
            if (!scenario.resources) scenario.resources = [];
            scenario.resources.push({
                name: `Ресурс ${scenario.resources.length + 1}`,
                capacity: 50,
                reliability: 0.9
            });
            this.render();
            if (window.app) window.app.persistProject(true);
        }
    }

    removeResource(scenarioId, index) {
        const scenario = this.findScenario(scenarioId);
        if (scenario && scenario.resources) {
            const resource = scenario.resources[index];
            const name = resource?.name ? ` «${resource.name}»` : '';
            if (!confirm(`Удалить ресурс${name}?`)) return;
            scenario.resources.splice(index, 1);
            this.render();
            if (window.app) window.app.persistProject(true);
        }
    }

    updateResource(scenarioId, index, field, value) {
        const scenario = this.findScenario(scenarioId);
        if (scenario && scenario.resources && scenario.resources[index]) {
            if (field === 'name') {
                scenario.resources[index][field] = String(value || '').trim();
            } else if (field === 'reliability') {
                scenario.resources[index][field] = NumberUtils.clamp(value, 0, 1, 0.95);
            } else {
                scenario.resources[index][field] = NumberUtils.safeNumber(value, 0);
            }

            // Update metrics in real-time for this card
            const metrics = Calculators.calculateQueueMetrics(scenario.demand, scenario.resources);
            const newIndex = Calculators.calculateOperationsIndex(scenario);

            const card = document.querySelector(`[data-scenario-id="${scenarioId}"]`);
            if (card) {
                const rhoLabel = card.querySelector('.metric-rho .metric-label');
                const wqLabel = card.querySelector('.metric-wq .metric-label');
                const idxLabel = card.querySelector('.metric-index .metric-label');
                const rhoEl = card.querySelector('.metric-rho');
                const rhoBar = card.querySelector('.metric-rho .mini-progress__fill');
                const wqBar = card.querySelector('.metric-wq .mini-progress__fill');
                const idxBar = card.querySelector('.metric-index .mini-progress__fill');
                const rhoPercent = this.getRhoPercent(metrics.rho);
                const wqPercent = this.getWqPercent(metrics.wq);
                const indexPercent = this.getIndexPercent(newIndex);

                if (rhoLabel) {
                    rhoLabel.textContent = `ρ: ${metrics.rho === Infinity ? '∞' : metrics.rho}`;
                }
                if (rhoEl) {
                    rhoEl.classList.remove('metric-badge--success', 'metric-badge--warning', 'metric-badge--danger');
                    rhoEl.classList.add(this.getRhoBadgeClass(metrics.rho));
                }
                if (wqLabel) wqLabel.textContent = `Wq: ${metrics.wq === Infinity ? '∞' : metrics.wq}`;
                if (idxLabel) idxLabel.textContent = `Индекс: ${newIndex}`;
                if (rhoBar) rhoBar.style.width = `${rhoPercent}%`;
                if (wqBar) wqBar.style.width = `${wqPercent}%`;
                if (idxBar) idxBar.style.width = `${indexPercent}%`;
                if (rhoBar?.parentElement) {
                    const value = metrics.rho === Infinity ? '∞' : metrics.rho;
                    rhoBar.parentElement.setAttribute('aria-label', `Загрузка ${value}`);
                }
                if (wqBar?.parentElement) {
                    const value = metrics.wq === Infinity ? '∞' : metrics.wq;
                    wqBar.parentElement.setAttribute('aria-label', `Ожидание ${value}`);
                }
                if (idxBar?.parentElement) {
                    idxBar.parentElement.setAttribute('aria-label', `Индекс устойчивости ${newIndex}`);
                }
            }

            // Also refresh global index
            this.updateOperationsIndex();
            if (window.app) window.app.persistProject(true);
        }
    }

    findScenario(id) {
        const scenarios = this.project.operations?.scenarios || [];
        return scenarios.find(s => s.id === id);
    }

    updateOperationsIndex() {
        const scenarios = this.project.operations?.scenarios || [];
        const indexEl = document.getElementById('operationsIndex');

        if (!indexEl) return;

        if (scenarios.length === 0) {
            indexEl.textContent = '-';
            return;
        }

        // Calculate average index across all scenarios
        const totalIndex = scenarios.reduce((sum, scenario) => {
            return sum + Calculators.calculateOperationsIndex(scenario);
        }, 0);

        const averageIndex = Math.round(totalIndex / scenarios.length);
        indexEl.textContent = averageIndex;
    }

    getRhoBadgeClass(rho) {
        if (rho === Infinity) return 'metric-badge--danger';
        const value = NumberUtils.safeNumber(rho, 0);
        if (value < 0.7) return 'metric-badge--success';
        if (value <= 0.85) return 'metric-badge--warning';
        return 'metric-badge--danger';
    }

    getRhoPercent(rho) {
        if (rho === Infinity) return 100;
        return NumberUtils.clamp(rho, 0, 1, 0) * 100;
    }

    getWqPercent(wq) {
        if (wq === Infinity) return 100;
        const safeValue = NumberUtils.safeNumber(wq, 0);
        const normalized = Math.log1p(Math.max(0, safeValue)) / Math.log1p(10);
        return Math.min(Math.max(normalized, 0), 1) * 100;
    }

    getIndexPercent(index) {
        return NumberUtils.clamp(index, 0, 100, 0);
    }

    save() {
        return this.project;
    }

    refresh() {
        this.render();
    }

    esc(str) {
        return String(str ?? '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c]));
    }
}
