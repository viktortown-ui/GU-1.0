// Модуль Портфель идей
class Portfolio {
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
        if (!this.project.portfolio || !this.project.portfolio.ideas) return 1;
        return Math.max(...this.project.portfolio.ideas.map(i => i.id), 0) + 1;
    }
    
    bindEvents() {
        const addBtn = document.getElementById('addIdea');
        const runSimulationBtn = document.getElementById('runSimulation');
        
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addIdea());
        }
        if (runSimulationBtn) {
            runSimulationBtn.addEventListener('click', () => this.runSimulation());
        }
    }
    
    render() {
        this.renderIdeasList();
        this.updatePortfolioStats();
    }
    
    renderIdeasList() {
        const container = document.getElementById('ideasList');
        const ideas = this.project.portfolio?.ideas || [];
        
        if (!container) return;
        
        if (ideas.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-lightbulb text-4xl mb-4"></i>
                    <p>В портфеле пока нет идей. Добавьте первую идею для анализа.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = ideas.map(idea => this.renderIdeaCard(idea)).join('');
        this.bindIdeaEvents();
    }
    
    renderIdeaCard(idea) {
        const index = this.calculateIdeaIndex(idea);
        
        return `
            <div class="bg-white border border-gray-200 rounded-lg p-4" data-idea-id="${idea.id}">
                <div class="flex items-center justify-between mb-4">
                    <input 
                        type="text" 
                        class="idea-name text-lg font-semibold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                        value="${idea.name || 'Новая идея'}"
                        onchange="app.modules.portfolio.updateIdea(${idea.id}, 'name', this.value)"
                    />
                    <button 
                        onclick="app.modules.portfolio.deleteIdea(${idea.id})" 
                        class="text-red-500 hover:text-red-700 transition-colors"
                        title="Удалить идею"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Базовый доход</label>
                        <input 
                            type="number" 
                            class="idea-revenue-base w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value="${idea.revenue?.base || 0}"
                            onchange="app.modules.portfolio.updateIdeaRevenue(${idea.id}, 'base', parseFloat(this.value))"
                        />
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Пессимистичный</label>
                        <input 
                            type="number" 
                            class="idea-revenue-pessimistic w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value="${idea.revenue?.pessimistic || 0}"
                            onchange="app.modules.portfolio.updateIdeaRevenue(${idea.id}, 'pessimistic', parseFloat(this.value))"
                        />
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Оптимистичный</label>
                        <input 
                            type="number" 
                            class="idea-revenue-optimistic w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value="${idea.revenue?.optimistic || 0}"
                            onchange="app.modules.portfolio.updateIdeaRevenue(${idea.id}, 'optimistic', parseFloat(this.value))"
                        />
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Риск (0-1)</label>
                        <input 
                            type="number" 
                            class="idea-risk w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value="${idea.risk || 0.3}"
                            min="0"
                            max="1"
                            step="0.1"
                            onchange="app.modules.portfolio.updateIdea(${idea.id}, 'risk', parseFloat(this.value))"
                        />
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Нагрузка (0-1)</label>
                        <input 
                            type="number" 
                            class="idea-load w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value="${idea.load || 0.5}"
                            min="0"
                            max="1"
                            step="0.1"
                            onchange="app.modules.portfolio.updateIdea(${idea.id}, 'load', parseFloat(this.value))"
                        />
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Время (мес)</label>
                        <input 
                            type="number" 
                            class="idea-time w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value="${idea.time || 6}"
                            min="1"
                            onchange="app.modules.portfolio.updateIdea(${idea.id}, 'time', parseInt(this.value))"
                        />
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Деньги</label>
                        <input 
                            type="number" 
                            class="idea-money w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value="${idea.money || 0}"
                            onchange="app.modules.portfolio.updateIdea(${idea.id}, 'money', parseFloat(this.value))"
                        />
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Доля в портфеле</label>
                        <input 
                            type="number" 
                            class="idea-weight w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value="${idea.weight || 0.5}"
                            min="0"
                            max="1"
                            step="0.1"
                            onchange="app.modules.portfolio.updateIdea(${idea.id}, 'weight', parseFloat(this.value))"
                        />
                    </div>
                    <div class="flex items-center justify-center">
                        <div class="text-center">
                            <div class="text-xs text-gray-600 mb-1">Индекс</div>
                            <div class="idea-index text-lg font-bold text-blue-600">${index}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    bindIdeaEvents() {
        // Events are bound through inline handlers
    }
    
    addIdea() {
        const ideas = this.project.portfolio?.ideas || [];
        const newIdea = {
            id: this.nextId++,
            name: `Идея ${ideas.length + 1}`,
            revenue: {
                base: 100000,
                pessimistic: 70000,
                optimistic: 150000
            },
            risk: 0.3,
            load: 0.5,
            time: 6,
            money: 50000,
            weight: 0.5,
            index: 0
        };
        
        ideas.push(newIdea);
        this.updateIdeaIndex(newIdea);
        
        if (!this.project.portfolio) {
            this.project.portfolio = { ideas: [], simulation: { n: 500, var: 0, cvar: 0, portfolioIndex: 0 } };
        }
        this.project.portfolio.ideas = ideas;
        
        this.render();
    }
    
    deleteIdea(id) {
        if (!confirm('Удалить идею из портфеля?')) return;
        
        const ideas = this.project.portfolio?.ideas || [];
        this.project.portfolio.ideas = ideas.filter(i => i.id !== id);
        this.render();
    }
    
    updateIdea(id, field, value) {
        const idea = this.findIdea(id);
        if (idea) {
            idea[field] = value;
            this.updateIdeaIndex(idea);

            // Update index on card without full rerender
            const card = document.querySelector(`[data-idea-id="${id}"]`);
            const idxEl = card ? card.querySelector('.idea-index') : null;
            if (idxEl) idxEl.textContent = idea.index;

            this.updatePortfolioStats();
        }
    }

    updateIdeaRevenue(id, type, value) {
        const idea = this.findIdea(id);
        if (idea) {
            if (!idea.revenue) idea.revenue = { base: 0, pessimistic: 0, optimistic: 0 };
            idea.revenue[type] = value;
            this.updateIdeaIndex(idea);
            this.renderIdeasList();
            this.updatePortfolioStats();
        }
    }
    
    findIdea(id) {
        const ideas = this.project.portfolio?.ideas || [];
        return ideas.find(i => i.id === id);
    }
    
    calculateIdeaIndex(idea) {
        // Simple index calculation based on risk, load, time and money efficiency
        const revenueEfficiency = (idea.revenue?.base || 0) / Math.max(idea.money || 1, 1);
        const timeEfficiency = 1 / Math.max(idea.time || 1, 1);
        const riskFactor = 1 - (idea.risk || 0);
        const loadFactor = 1 - (idea.load || 0);
        
        const index = Math.round((revenueEfficiency / 1000) * timeEfficiency * riskFactor * loadFactor * 100);
        return Math.min(Math.max(index, 0), 100);
    }
    
    updateIdeaIndex(idea) {
        idea.index = this.calculateIdeaIndex(idea);
    }
    
    updatePortfolioStats() {
        const ideas = this.project.portfolio?.ideas || [];
        
        // Update count
        const countEl = document.getElementById('portfolioCount');
        if (countEl) countEl.textContent = ideas.length;
        
        // Update average risk
        const riskEl = document.getElementById('averageRisk');
        if (riskEl && ideas.length > 0) {
            const avgRisk = ideas.reduce((sum, idea) => sum + idea.risk, 0) / ideas.length;
            riskEl.textContent = avgRisk.toFixed(2);
        } else if (riskEl) {
            riskEl.textContent = '-';
        }
        
        // Update portfolio index
        const indexEl = document.getElementById('portfolioIndex');
        if (indexEl && ideas.length > 0) {
            const portfolioIndex = Calculators.calculatePortfolioIndex(this.project.portfolio);
            indexEl.textContent = portfolioIndex;
        } else if (indexEl) {
            indexEl.textContent = '-';
        }
    }
    
    runSimulation() {
        const ideas = this.project.portfolio?.ideas || [];
        
        if (ideas.length === 0) {
            alert('Добавьте хотя бы одну идею для симуляции');
            return;
        }
        
        // Show loading state
        const runBtn = document.getElementById('runSimulation');
        const originalText = runBtn.innerHTML;
        runBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Симуляция...';
        runBtn.disabled = true;
        
        // Run simulation with delay for UI responsiveness
        setTimeout(() => {
            const simulation = Calculators.simulatePortfolio(this.project.portfolio, 500);
            
            // Update project data
            if (!this.project.portfolio.simulation) {
                this.project.portfolio.simulation = {};
            }
            this.project.portfolio.simulation = {
                n: 500,
                var: simulation.var,
                cvar: simulation.cvar,
                portfolioIndex: Calculators.calculatePortfolioIndex(this.project.portfolio)
            };
            
            // Show results
            this.showSimulationResults(simulation);
            
            // Reset button
            runBtn.innerHTML = originalText;
            runBtn.disabled = false;
        }, 100);
    }
    
    showSimulationResults(simulation) {
        const resultsEl = document.getElementById('simulationResults');
        const meanEl = document.getElementById('simulationMean');
        const varEl = document.getElementById('simulationVar');
        const cvarEl = document.getElementById('simulationCvar');
        const stdEl = document.getElementById('simulationStd');
        
        if (resultsEl) resultsEl.classList.remove('hidden');
        if (meanEl) meanEl.textContent = simulation.mean.toLocaleString() + ' ₽';
        if (varEl) varEl.textContent = simulation.var.toLocaleString() + ' ₽';
        if (cvarEl) cvarEl.textContent = simulation.cvar.toLocaleString() + ' ₽';
        if (stdEl) stdEl.textContent = simulation.std.toLocaleString() + ' ₽';
        
        // Update portfolio index
        const indexEl = document.getElementById('portfolioIndex');
        if (indexEl) {
            indexEl.textContent = this.project.portfolio.simulation.portfolioIndex;
        }
    }
    
    save() {
        return this.project;
    }
    
    refresh() {
        this.render();
    }
}