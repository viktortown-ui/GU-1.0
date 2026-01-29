// Модуль Premortem Lite
class PremortemLite {
    constructor(project) {
        this.project = project;
        this.currentStep = 1;
        this.totalSteps = 7;

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStep(this.currentStep);
    }

    bindEvents() {
        // Step navigation
        document.querySelectorAll('.step-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const step = parseInt(e.target.dataset.step);
                if (step && step !== this.currentStep) {
                    this.goToStep(step);
                }
            });
        });

        // Prev/Next buttons
        const prevBtn = document.getElementById('prevStep');
        const nextBtn = document.getElementById('nextStep');

        if (prevBtn) prevBtn.addEventListener('click', () => this.previousStep());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());

        // Auto-save on input changes
        document.addEventListener('input', (e) => {
            // Only when Premortem module is visible
            // (id in app.html is "premortem-module")
            const moduleEl = document.getElementById('premortem-module');
            if (!moduleEl || moduleEl.classList.contains('hidden') || !moduleEl.contains(e.target)) return;

            this.saveCurrentStep();

            // Refresh dynamic blocks in-place
            if (this.currentStep === 3) this.updateProfitScenarios();
            if (this.currentStep === 4) this.updateFogI();
            if (this.currentStep === 5) this.updateIllI();
            if (this.currentStep === 7) this.updateTotalDuration();

            this.save();
            if (window.app) window.app.persistProject(true);
        });
    }

    goToStep(step) {
        if (step < 1 || step > this.totalSteps) return;

        this.saveCurrentStep();
        this.currentStep = step;
        this.loadStep(step);
        this.updateNavigation();
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.goToStep(this.currentStep + 1);
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.goToStep(this.currentStep - 1);
        }
    }

    updateNavigation() {
        // Update step indicators
        document.querySelectorAll('.step-btn').forEach((btn, index) => {
            const stepNum = index + 1;
            btn.classList.remove('bg-blue-600', 'text-white', 'bg-gray-200', 'text-gray-600');
            btn.classList.remove('step-active');

            if (stepNum === this.currentStep) {
                btn.classList.add('bg-blue-600', 'text-white');
                btn.classList.add('step-active');
            } else {
                btn.classList.add('bg-gray-200', 'text-gray-600');
            }
        });

        // Update current step display
        const currentStepEl = document.getElementById('currentStep');
        if (currentStepEl) currentStepEl.textContent = this.currentStep;

        // Update prev/next buttons
        const prevBtn = document.getElementById('prevStep');
        const nextBtn = document.getElementById('nextStep');

        if (prevBtn) prevBtn.disabled = this.currentStep === 1;
        if (nextBtn) {
            nextBtn.disabled = this.currentStep === this.totalSteps;
            if (this.currentStep === this.totalSteps) {
                nextBtn.innerHTML = 'Готово<i class="fas fa-check ml-2"></i>';
            } else {
                nextBtn.innerHTML = 'Далее<i class="fas fa-arrow-right ml-2"></i>';
            }
        }
    }

    loadStep(step) {
        const content = document.getElementById('stepContent');
        if (!content) return;

        let html = '';

        switch (step) {
            case 1:
                html = this.renderStep1();
                break;
            case 2:
                html = this.renderStep2();
                break;
            case 3:
                html = this.renderStep3();
                break;
            case 4:
                html = this.renderStep4();
                break;
            case 5:
                html = this.renderStep5();
                break;
            case 6:
                html = this.renderStep6();
                break;
            case 7:
                html = this.renderStep7();
                break;
        }

        content.innerHTML = html;
        this.updateNavigation();

        // Post-render hooks for dynamic blocks
        setTimeout(() => {
            if (step === 3) this.updateProfitScenarios();
            if (step === 4) this.updateFogI();
            if (step === 5) this.updateIllI();
            if (step === 7) {
                this.bindPlanEvents();
                this.updateTotalDuration();
            }
        }, 0);
    }

    renderHint(text) {
        return `<button type="button" class="hint" data-tooltip="${this.esc(text)}" aria-label="${this.esc(text)}">i</button>`;
    }

    renderStep1() {
        const { client, problem, solution, format } = this.project.premortem;

        return `
            <div class="space-y-6">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Шаг 1. Понятное описание идеи</h3>
                    <p class="text-gray-600 mb-6">Заполните четыре коротких блока — так быстрее увидеть, что именно вы продаёте.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            Клиент ${this.renderHint('Кому вы помогаете: кто этот человек/компания?')}
                        </label>
                        <textarea
                            id="client"
                            rows="4"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Например: владельцы кофеен в центре города"
                        >${client}</textarea>
                    </div>

                    <div>
                        <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            Проблема ${this.renderHint('Что у клиента болит? Что мешает?')}
                        </label>
                        <textarea
                            id="problem"
                            rows="4"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Например: нет стабильного потока гостей по будням"
                        >${problem}</textarea>
                    </div>

                    <div>
                        <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            Решение ${this.renderHint('Каким способом вы решаете проблему?')}
                        </label>
                        <textarea
                            id="solution"
                            rows="4"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Например: программа лояльности + локальная реклама"
                        >${solution}</textarea>
                    </div>

                    <div>
                        <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            Формат поставки ${this.renderHint('В каком виде клиент получает результат?')}
                        </label>
                        <textarea
                            id="format"
                            rows="4"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Например: подписка на сервис + настройка под ключ"
                        >${format}</textarea>
                    </div>
                </div>

                <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 class="font-medium text-blue-900 mb-2">Подсказка:</h4>
                    <p class="text-sm text-blue-800">Пиши как другу: «Мы помогаем [кому] сделать [что] без [боли], за счёт [как]».</p>
                </div>
            </div>
        `;
    }

    renderStep2() {
        const oneLiners = this.project.premortem.oneLiners || ['', '', ''];

        return `
            <div class="space-y-6">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Шаг 2. Три версии one-liner</h3>
                    <p class="text-gray-600 mb-6">Сделайте три коротких формулировки. Потом выберете лучшую.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Вариант 1</label>
                        <input
                            type="text"
                            id="oneLiner1"
                            value="${oneLiners[0] || ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Мы помогаем..."
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Вариант 2</label>
                        <input
                            type="text"
                            id="oneLiner2"
                            value="${oneLiners[1] || ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Сервис для..."
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Вариант 3</label>
                        <input
                            type="text"
                            id="oneLiner3"
                            value="${oneLiners[2] || ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Еще один вариант..."
                        />
                    </div>
                </div>

                <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 class="font-medium text-blue-900 mb-2">Подсказка:</h4>
                    <p class="text-sm text-blue-800">Хороший one-liner включает клиента, проблему, решение и результат. Пример: "Мы помогаем малому бизнесу автоматизировать бухучет через Telegram-бота за 5 минут в день."</p>
                </div>
            </div>
        `;
    }

    renderStep3() {
        const econ = this.project.premortem.economics;

        return `
            <div class="space-y-6">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Шаг 3. Экономика диапазонами</h3>
                    <p class="text-gray-600 mb-6">Оцените минимум/базу/максимум — это честнее, чем одно число.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h4 class="font-medium text-gray-900 mb-4 flex items-center gap-2">Цена за единицу ${this.renderHint('Сколько клиент платит за одну покупку/подписку?')}</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-xs text-gray-600 mb-1">Минимум</label>
                                <input type="number" id="priceMin" value="${econ.price.min}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label class="block text-xs text-gray-600 mb-1">Типично</label>
                                <input type="number" id="priceTyp" value="${econ.price.typ}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label class="block text-xs text-gray-600 mb-1">Максимум</label>
                                <input type="number" id="priceMax" value="${econ.price.max}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 class="font-medium text-gray-900 mb-4 flex items-center gap-2">Спрос (кол-во) ${this.renderHint('Сколько продаж/подписок в месяц?')}</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-xs text-gray-600 mb-1">Минимум</label>
                                <input type="number" id="demandMin" value="${econ.demand.min}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label class="block text-xs text-gray-600 mb-1">Типично</label>
                                <input type="number" id="demandTyp" value="${econ.demand.typ}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label class="block text-xs text-gray-600 mb-1">Максимум</label>
                                <input type="number" id="demandMax" value="${econ.demand.max}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 class="font-medium text-gray-900 mb-4 flex items-center gap-2">Расходы на единицу ${this.renderHint('Прямые расходы на одну продажу/клиента.')}</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-xs text-gray-600 mb-1">Минимум</label>
                                <input type="number" id="expensesMin" value="${econ.expenses.min}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label class="block text-xs text-gray-600 mb-1">Типично</label>
                                <input type="number" id="expensesTyp" value="${econ.expenses.typ}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label class="block text-xs text-gray-600 mb-1">Максимум</label>
                                <input type="number" id="expensesMax" value="${econ.expenses.max}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-6 p-4 bg-green-50 rounded-lg">
                    <h4 class="font-medium text-green-900 mb-2">Расчет прибыли по сценариям:</h4>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span class="text-green-700">Пессимистичный: </span>
                            <span class="font-medium" id="profitPessimistic">-</span>
                        </div>
                        <div>
                            <span class="text-green-700">Типичный: </span>
                            <span class="font-medium" id="profitTypical">-</span>
                        </div>
                        <div>
                            <span class="text-green-700">Оптимистичный: </span>
                            <span class="font-medium" id="profitOptimistic">-</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderStep4() {
        const checklist = this.project.premortem.fogi.checklist;

        return `
            <div class="space-y-6">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Шаг 4. FogI (индекс тумана)</h3>
                    <p class="text-gray-600 mb-6">Отметьте пункты, которые уже понятны. Остальное — зона проверки.</p>
                </div>

                <div class="space-y-3">
                    ${checklist.map((item, index) => `
                        <div class="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                            <input
                                type="checkbox"
                                id="fogi_${index}"
                                ${item.checked ? 'checked' : ''}
                                class="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label for="fogi_${index}" class="flex-1 text-sm text-gray-700 cursor-pointer">
                                ${item.text}
                            </label>
                        </div>
                    `).join('')}
                </div>

                <div class="mt-6 p-4 bg-yellow-50 rounded-lg">
                    <div class="flex items-center justify-between">
                        <span class="font-medium text-yellow-900">Доля "не знаю":</span>
                        <span id="fogiPercentage" class="text-2xl font-bold text-yellow-700">${this.project.premortem.fogi.percentage}%</span>
                    </div>
                    <div class="mt-2 w-full bg-yellow-200 rounded-full h-2">
                        <div id="fogiProgress" class="bg-yellow-500 h-2 rounded-full transition-all duration-300" style="width: ${this.project.premortem.fogi.percentage}%;"></div>
                    </div>
                </div>
            </div>
        `;
    }

    renderStep5() {
        const anomalies = this.project.premortem.illi.anomalies;

        return `
            <div class="space-y-6">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Шаг 5. IllI (индекс иллюзий)</h3>
                    <p class="text-gray-600 mb-6">Отметьте риски, которые могут «сломать» красивую картинку.</p>
                </div>

                <div class="space-y-3">
                    ${anomalies.map((item, index) => `
                        <div class="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                            <input
                                type="checkbox"
                                id="illi_${index}"
                                ${item.active ? 'checked' : ''}
                                class="mt-1 w-5 h-5 text-red-600 rounded focus:ring-red-500"
                            />
                            <label for="illi_${index}" class="flex-1 text-sm text-gray-700 cursor-pointer">
                                ${item.text}
                            </label>
                        </div>
                    `).join('')}
                </div>

                <div class="mt-6 p-4 bg-red-50 rounded-lg">
                    <div class="flex items-center justify-between">
                        <span class="font-medium text-red-900">Активных аномалий:</span>
                        <span id="illiCount" class="text-2xl font-bold text-red-700">${anomalies.filter(a => a.active).length}</span>
                    </div>
                    <p class="text-sm text-red-600 mt-2">Чем больше аномалий, тем выше риск проекта</p>
                </div>
            </div>
        `;
    }

    renderStep6() {
        const verdict = this.project.premortem.verdict;
        const profitScenarios = Calculators.calculateProfitScenarios(this.project.premortem.economics);
        const fogi = Calculators.calculateFogI(this.project.premortem.fogi.checklist);
        const illi = this.project.premortem.illi.anomalies.filter(a => a.active).length;
        const calculatedVerdict = Calculators.calculateVerdict(profitScenarios, fogi, illi);

        return `
            <div class="space-y-6">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Шаг 6. Вердикт</h3>
                    <p class="text-gray-600 mb-6">Система предлагает решение, но финальный выбор — ваш.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <h4 class="font-medium text-gray-900 mb-3">Метрики</h4>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span>Средняя прибыль:</span>
                                <span class="font-medium">${NumberUtils.formatNumber(Math.round((profitScenarios.pessimistic + profitScenarios.typical + profitScenarios.optimistic) / 3))}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>FogI (не знаю):</span>
                                <span class="font-medium">${fogi}%</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Аномалий:</span>
                                <span class="font-medium">${illi}</span>
                            </div>
                        </div>
                    </div>

                    <div class="p-4 rounded-lg ${this.getVerdictClass(calculatedVerdict.status)}">
                        <h4 class="font-medium mb-3">Рекомендуемый вердикт</h4>
                        <div class="text-2xl font-bold mb-2">${this.getVerdictText(calculatedVerdict.status)}</div>
                        <p class="text-sm">${calculatedVerdict.reason}</p>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Итоговое решение</label>
                    <select id="finalVerdict" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="proceed" ${verdict.status === 'proceed' ? 'selected' : ''}>Запускать</option>
                        <option value="review" ${verdict.status === 'review' ? 'selected' : ''}>Доработать</option>
                        <option value="pause" ${verdict.status === 'pause' ? 'selected' : ''}>Приостановить</option>
                        <option value="kill" ${verdict.status === 'kill' ? 'selected' : ''}>Закрыть</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Обоснование решения</label>
                    <textarea
                        id="verdictReason"
                        rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Почему принято именно это решение?"
                    >${verdict.reason}</textarea>
                </div>
            </div>
        `;
    }

    renderStep7() {
        const plan = this.project.premortem.plan;

        return `
            <div class="space-y-6">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Шаг 7. План действий (5-7 шагов)</h3>
                    <p class="text-gray-600 mb-6">Определите ближайшие 1–2 недели. План снижает туман.</p>
                </div>

                <div id="planSteps" class="space-y-4">
                    ${plan.length === 0 ? this.renderEmptyPlan() : plan.map((step, index) => this.renderPlanStep(step, index)).join('')}
                </div>

                <div class="flex flex-wrap gap-3">
                    <button id="addStep" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-plus mr-2"></i>Добавить шаг
                    </button>
                    ${plan.length > 0 ? `
                        <button id="removeStep" class="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
                            <i class="fas fa-trash mr-2"></i>Удалить последний
                        </button>
                    ` : ''}
                </div>

                <div class="mt-6 p-4 bg-green-50 rounded-lg">
                    <div class="flex items-center justify-between">
                        <span class="font-medium text-green-900">Общая продолжительность:</span>
                        <span id="totalDuration" class="text-lg font-bold text-green-700">${plan.reduce((sum, step) => sum + NumberUtils.safeNumber(step.duration, 0), 0)} дней</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyPlan() {
        return `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-list-ul text-4xl mb-4"></i>
                <p>Добавьте первый шаг плана</p>
            </div>
        `;
    }

    renderPlanStep(step, index) {
        return `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        ${index + 1}
                    </div>
                    <div class="flex-1 space-y-3">
                        <input
                            type="text"
                            class="step-description w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Описание шага"
                            value="${step.step || ''}"
                        />
                        <div class="flex items-center space-x-3">
                            <label class="text-sm text-gray-600">Продолжительность:</label>
                            <input
                                type="number"
                                class="step-duration w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value="${step.duration || 7}"
                                min="1"
                            />
                            <span class="text-sm text-gray-600">дней</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getVerdictClass(status) {
        const classes = {
            proceed: 'bg-green-50 text-green-900',
            review: 'bg-yellow-50 text-yellow-900',
            pause: 'bg-orange-50 text-orange-900',
            kill: 'bg-red-50 text-red-900'
        };
        return classes[status] || 'bg-gray-50 text-gray-900';
    }

    getVerdictText(status) {
        const texts = {
            proceed: 'Запускать',
            review: 'Доработать',
            pause: 'Приостановить',
            kill: 'Закрыть'
        };
        return texts[status] || 'Не определено';
    }

    saveCurrentStep() {
        const stepData = this.collectStepData();
        if (stepData) {
            this.project.premortem = { ...this.project.premortem, ...stepData };
        }
    }

    collectStepData() {
        switch (this.currentStep) {
            case 1:
                return {
                    client: document.getElementById('client')?.value || '',
                    problem: document.getElementById('problem')?.value || '',
                    solution: document.getElementById('solution')?.value || '',
                    format: document.getElementById('format')?.value || ''
                };
            case 2:
                return {
                    oneLiners: [
                        document.getElementById('oneLiner1')?.value || '',
                        document.getElementById('oneLiner2')?.value || '',
                        document.getElementById('oneLiner3')?.value || ''
                    ]
                };
            case 3:
                return {
                    economics: {
                        price: {
                            min: NumberUtils.safeNumber(document.getElementById('priceMin')?.value, 0),
                            typ: NumberUtils.safeNumber(document.getElementById('priceTyp')?.value, 0),
                            max: NumberUtils.safeNumber(document.getElementById('priceMax')?.value, 0)
                        },
                        demand: {
                            min: NumberUtils.safeNumber(document.getElementById('demandMin')?.value, 0),
                            typ: NumberUtils.safeNumber(document.getElementById('demandTyp')?.value, 0),
                            max: NumberUtils.safeNumber(document.getElementById('demandMax')?.value, 0)
                        },
                        expenses: {
                            min: NumberUtils.safeNumber(document.getElementById('expensesMin')?.value, 0),
                            typ: NumberUtils.safeNumber(document.getElementById('expensesTyp')?.value, 0),
                            max: NumberUtils.safeNumber(document.getElementById('expensesMax')?.value, 0)
                        }
                    }
                };
            case 4: {
                const checklist = this.project.premortem.fogi.checklist;
                checklist.forEach((item, index) => {
                    const checkbox = document.getElementById(`fogi_${index}`);
                    if (checkbox) item.checked = checkbox.checked;
                });
                return {
                    fogi: {
                        ...this.project.premortem.fogi,
                        checklist,
                        percentage: Calculators.calculateFogI(checklist)
                    }
                };
            }
            case 5: {
                const anomalies = this.project.premortem.illi.anomalies;
                anomalies.forEach((item, index) => {
                    const checkbox = document.getElementById(`illi_${index}`);
                    if (checkbox) item.active = checkbox.checked;
                });
                return {
                    illi: {
                        ...this.project.premortem.illi,
                        anomalies
                    }
                };
            }
            case 6:
                return {
                    verdict: {
                        status: document.getElementById('finalVerdict')?.value || 'review',
                        reason: document.getElementById('verdictReason')?.value || ''
                    }
                };
            case 7: {
                const steps = [];
                document.querySelectorAll('.step-description').forEach((desc, index) => {
                    const duration = document.querySelectorAll('.step-duration')[index];
                    if (desc.value.trim()) {
                        steps.push({
                            id: index + 1,
                            step: desc.value.trim(),
                            duration: NumberUtils.clamp(duration?.value, 1, 365, 7)
                        });
                    }
                });
                return { plan: steps };
            }
            default:
                return null;
        }
    }

    save() {
        this.saveCurrentStep();
        return this.project;
    }

    refresh() {
        // Recalculate dynamic values
        if (this.currentStep === 3) {
            setTimeout(() => this.updateProfitScenarios(), 100);
        } else if (this.currentStep === 4) {
            setTimeout(() => this.updateFogI(), 100);
        } else if (this.currentStep === 7) {
            this.bindPlanEvents();
        }
    }

    updateProfitScenarios() {
        const economics = {
            price: {
                min: NumberUtils.safeNumber(document.getElementById('priceMin')?.value, 0),
                typ: NumberUtils.safeNumber(document.getElementById('priceTyp')?.value, 0),
                max: NumberUtils.safeNumber(document.getElementById('priceMax')?.value, 0)
            },
            demand: {
                min: NumberUtils.safeNumber(document.getElementById('demandMin')?.value, 0),
                typ: NumberUtils.safeNumber(document.getElementById('demandTyp')?.value, 0),
                max: NumberUtils.safeNumber(document.getElementById('demandMax')?.value, 0)
            },
            expenses: {
                min: NumberUtils.safeNumber(document.getElementById('expensesMin')?.value, 0),
                typ: NumberUtils.safeNumber(document.getElementById('expensesTyp')?.value, 0),
                max: NumberUtils.safeNumber(document.getElementById('expensesMax')?.value, 0)
            }
        };

        const scenarios = Calculators.calculateProfitScenarios(economics);

        const pessimisticEl = document.getElementById('profitPessimistic');
        const typicalEl = document.getElementById('profitTypical');
        const optimisticEl = document.getElementById('profitOptimistic');

        if (pessimisticEl) pessimisticEl.textContent = NumberUtils.formatNumber(scenarios.pessimistic);
        if (typicalEl) typicalEl.textContent = NumberUtils.formatNumber(scenarios.typical);
        if (optimisticEl) optimisticEl.textContent = NumberUtils.formatNumber(scenarios.optimistic);
    }

    updateFogI() {
        const checklist = this.project.premortem.fogi.checklist;
        const percentage = Calculators.calculateFogI(checklist);

        const percentageEl = document.getElementById('fogiPercentage');
        const progressEl = document.getElementById('fogiProgress');

        if (percentageEl) percentageEl.textContent = percentage + '%';
        if (progressEl) progressEl.style.width = percentage + '%';
    }

    updateIllI() {
        // Count active anomalies and update UI
        const anomalies = this.project.premortem.illi?.anomalies || [];
        const activeCount = anomalies.filter(a => a.active).length;

        const countEl = document.getElementById('illiCount');
        if (countEl) countEl.textContent = activeCount;
    }

    bindPlanEvents() {
        const addBtn = document.getElementById('addStep');
        const removeBtn = document.getElementById('removeStep');

        if (addBtn) {
            addBtn.onclick = () => this.addPlanStep();
        }
        if (removeBtn) {
            removeBtn.onclick = () => this.removePlanStep();
        }
    }

    addPlanStep() {
        const planSteps = document.getElementById('planSteps');
        const newStep = {
            id: this.project.premortem.plan.length + 1,
            step: '',
            duration: 7
        };

        const stepHtml = this.renderPlanStep(newStep, this.project.premortem.plan.length);

        if (this.project.premortem.plan.length === 0) {
            planSteps.innerHTML = stepHtml;
        } else {
            planSteps.insertAdjacentHTML('beforeend', stepHtml);
        }

        this.project.premortem.plan.push(newStep);
        this.updateTotalDuration();
        if (window.app) window.app.persistProject(true);
    }

    removePlanStep() {
        if (this.project.premortem.plan.length > 0) {
            this.project.premortem.plan.pop();
            this.loadStep(7);
            if (window.app) window.app.persistProject(true);
        }
    }

    updateTotalDuration() {
        const total = this.project.premortem.plan.reduce((sum, step) => sum + NumberUtils.safeNumber(step.duration, 0), 0);
        const totalEl = document.getElementById('totalDuration');
        if (totalEl) totalEl.textContent = total + ' дней';
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
