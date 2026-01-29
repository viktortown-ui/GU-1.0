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

        return `
            <div class="bg-white border border-gray-200 rounded-lg p-6 space-y-6" data-scenario-id="${scenario.id}">
                <div class="flex items-start justify-between gap-4">
                    <input
                        type="text"
                        class="scenario-name text-lg font-semibold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                        value="${scenario.name || 'Новый сценарий'}"
                        onchange="app.modules.operations.updateScenario(${scenario.id}, 'name', this.value)"
                    />
                    <button
                        onclick="app.modules.operations.deleteScenario(${scenario.id})"
                        class="px-3 py-2 rounded-lg border border-red-200 text-red-500 hover:text-red-700 hover:border-red-300 transition-colors"
                        title="Удалить сценарий"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </div>

                <div class="space-y-4">
                    <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
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

                    <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
                </div>

                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 class="font-medium text-gray-900 mb-3">Результаты</h4>
                    <div class="flex flex-wrap gap-2">
                        <span class="metric-badge metric-rho ${rhoClass}">ρ: ${rhoValue}</span>
                        <span class="metric-badge metric-wq">Wq: ${wqValue}</span>
                        <span class="metric-badge metric-index">Индекс: ${index}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderResourceRow(scenarioId, resource, index) {
        return `
            <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <input
                    type="text"
                    class="resource-name flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Название ресурса"
                    value="${resource.name || ''}"
                    onchange="app.modules.operations.updateResource(${scenarioId}, ${index}, 'name', this.value)"
                />
                <div class="flex items-center space-x-2">
                    <label class="text-xs text-gray-600">Мощность:</label>
                    <input
                        type="number"
                        class="resource-capacity w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value="${NumberUtils.safeNumber(resource.capacity, 0)}"
                        min="0"
                        step="0.1"
                        onchange="app.modules.operations.updateResource(${scenarioId}, ${index}, 'capacity', NumberUtils.toFloatOrNull(this.value))"
                    />
                </div>
                <div class="flex items-center space-x-2">
                    <label class="text-xs text-gray-600">Надежность:</label>
                    <input
                        type="number"
                        class="resource-reliability w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value="${NumberUtils.clamp(resource.reliability, 0, 1, 0.95)}"
                        min="0"
                        max="1"
                        step="0.01"
                        onchange="app.modules.operations.updateResource(${scenarioId}, ${index}, 'reliability', NumberUtils.toFloatOrNull(this.value))"
                    />
                </div>
                <button
                    onclick="app.modules.operations.removeResource(${scenarioId}, ${index})"
                    class="px-2 py-1 rounded-lg border border-red-200 text-red-500 hover:text-red-700 hover:border-red-300 transition-colors"
                    title="Удалить ресурс"
                >
                    <i class="fas fa-trash text-sm"></i>
                </button>
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
                const rhoEl = card.querySelector('.metric-rho');
                const wqEl = card.querySelector('.metric-wq');
                const idxEl = card.querySelector('.metric-index');

                if (rhoEl) {
                    rhoEl.textContent = `ρ: ${metrics.rho === Infinity ? '∞' : metrics.rho}`;
                    rhoEl.classList.remove('metric-badge--success', 'metric-badge--warning', 'metric-badge--danger');
                    rhoEl.classList.add(this.getRhoBadgeClass(metrics.rho));
                }
                if (wqEl) wqEl.textContent = `Wq: ${metrics.wq === Infinity ? '∞' : metrics.wq}`;
                if (idxEl) idxEl.textContent = `Индекс: ${newIndex}`;
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
