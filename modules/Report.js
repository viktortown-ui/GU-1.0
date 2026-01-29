// Итоговый отчёт (HUB)
class Report {
    constructor(project) {
        this.project = project;
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        const printBtn = document.getElementById('reportPrintBtn');
        const copyBtn = document.getElementById('reportCopyBtn');

        if (printBtn) {
            printBtn.addEventListener('click', () => {
                // Печатаем только отчёт (см. @media print в app.html)
                window.print();
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const text = this.buildCopyText();
                this.copyToClipboard(text);
                this.flashButton(copyBtn, '<i class="fas fa-check mr-1"></i>Скопировано');
            });
        }
    }

    refresh() {
        this.render();
    }

    save() {
        return this.project;
    }

    // ---------- Rendering ----------

    render() {
        const container = document.getElementById('reportContent');
        if (!container) return;

        const data = this.collect();
        container.innerHTML = this.renderHtml(data);
    }

    collect() {
        const p = this.project?.premortem || {};
        const economics = p.economics || { price: {}, demand: {}, expenses: {} };
        const profit = Calculators.calculateProfitScenarios(economics);
        const fogi = Calculators.calculateFogI(p.fogi?.checklist || []);
        const illi = (p.illi?.anomalies || []).filter(a => a?.active).length;
        const recommended = Calculators.calculateVerdict(profit, fogi, illi);

        const finalVerdict = p.verdict?.status || 'review';
        const finalReason = (p.verdict?.reason || '').trim();

        // Segments
        const segments = (this.project?.segments?.segments || []);
        const activeSegments = segments.filter(s => s?.checked);
        const segmentIndices = activeSegments.map(s => ({
            name: (s?.name || 'Без названия').trim() || 'Без названия',
            value: Calculators.calculateSegmentIndex(s)
        }));
        const avgSeg = segmentIndices.length
            ? Math.round(segmentIndices.reduce((sum, x) => sum + x.value, 0) / segmentIndices.length)
            : null;
        const topSeg = segmentIndices.length
            ? segmentIndices.slice().sort((a, b) => b.value - a.value)[0]
            : null;

        // Operations
        const scenarios = (this.project?.operations?.scenarios || []);
        const opsIndices = scenarios.map(s => ({
            name: (s?.name || 'Сценарий').trim() || 'Сценарий',
            value: Calculators.calculateOperationsIndex(s)
        }));
        const avgOps = opsIndices.length
            ? Math.round(opsIndices.reduce((sum, x) => sum + x.value, 0) / opsIndices.length)
            : null;
        const worstOps = opsIndices.length
            ? opsIndices.slice().sort((a, b) => a.value - b.value)[0]
            : null;

        // Portfolio
        const ideas = (this.project?.portfolio?.ideas || []);
        const portfolioIndex = ideas.length ? Calculators.calculatePortfolioIndex(this.project.portfolio) : null;
        const avgRisk = ideas.length ? (ideas.reduce((s, i) => s + NumberUtils.safeNumber(i?.risk, 0), 0) / ideas.length) : null;
        const avgLoad = ideas.length ? (ideas.reduce((s, i) => s + NumberUtils.safeNumber(i?.load, 0), 0) / ideas.length) : null;
        const avgTime = ideas.length ? (ideas.reduce((s, i) => s + NumberUtils.safeNumber(i?.time, 0), 0) / ideas.length) : null;
        const simulation = ideas.length ? Calculators.simulatePortfolio(this.project.portfolio, 500) : null;

        // Plan
        const plan = Array.isArray(p.plan) ? p.plan : [];
        const totalDays = plan.reduce((sum, step) => sum + NumberUtils.safeNumber(step?.duration, 0), 0);

        // Composite (HUB index)
        const hub = this.calculateHubIndex({ finalVerdict, avgSeg, avgOps, portfolioIndex });

        return {
            project: {
                name: this.project?.name || 'Проект',
                description: this.project?.description || '',
                updatedAt: this.project?.updatedAt || ''
            },
            premortem: {
                finalVerdict,
                finalReason,
                recommended,
                profit,
                fogi,
                illi,
                oneLiner: this.getSelectedOneLiner(p),
                client: (p.client || '').trim(),
                problem: (p.problem || '').trim(),
                solution: (p.solution || '').trim(),
                format: (p.format || '').trim()
            },
            segments: {
                total: segments.length,
                active: activeSegments.length,
                avgIndex: avgSeg,
                top: topSeg
            },
            operations: {
                total: scenarios.length,
                avgIndex: avgOps,
                worst: worstOps
            },
            portfolio: {
                total: ideas.length,
                index: portfolioIndex,
                avgRisk,
                avgLoad,
                avgTime,
                simulation
            },
            plan: {
                steps: plan,
                totalDays
            },
            hub
        };
    }

    renderHtml(d) {
        const vFinal = this.verdictMeta(d.premortem.finalVerdict);
        const vRec = this.verdictMeta(d.premortem.recommended.status);

        const updated = d.project.updatedAt
            ? new Date(d.project.updatedAt).toLocaleString('ru-RU')
            : '--';

        const profit = d.premortem.profit;
        const profitAvg = Math.round((profit.pessimistic + profit.typical + profit.optimistic) / 3);

        const summary = this.buildSummary(d);
        const priorities = this.buildPriorityFixes(d);

        return `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <div class="text-xs text-gray-500">Обновлено: ${updated}</div>
                            <h3 class="text-xl font-bold text-gray-900 mt-1">${this.esc(d.project.name)}</h3>
                            ${d.project.description ? `<p class="text-gray-600 mt-2">${this.esc(d.project.description)}</p>` : ''}
                        </div>
                        <div class="text-right">
                            <div class="text-xs text-gray-500 mb-1">HUB-индекс</div>
                            <div class="text-3xl font-extrabold text-gray-900">${d.hub.score}</div>
                            <div class="text-xs ${d.hub.className}">${d.hub.label}</div>
                        </div>
                    </div>

                    <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="p-4 rounded-lg ${vFinal.cardClass}">
                            <div class="flex items-center justify-between">
                                <div class="text-sm font-medium opacity-90">Итоговое решение</div>
                                <i class="${vFinal.icon} opacity-90"></i>
                            </div>
                            <div class="text-2xl font-bold mt-2">${vFinal.text}</div>
                            <div class="text-sm opacity-90 mt-2">${this.esc(d.premortem.finalReason || '—')}</div>
                        </div>

                        <div class="p-4 rounded-lg ${vRec.cardClass}">
                            <div class="flex items-center justify-between">
                                <div class="text-sm font-medium opacity-90">Рекомендуемое системой</div>
                                <i class="${vRec.icon} opacity-90"></i>
                            </div>
                            <div class="text-2xl font-bold mt-2">${vRec.text}</div>
                            <div class="text-sm opacity-90 mt-2">${this.esc(d.premortem.recommended.reason || '—')}</div>
                        </div>
                    </div>

                    <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                        <div class="text-sm font-medium text-gray-700 mb-2">Краткое резюме</div>
                        <div class="text-gray-900 whitespace-pre-line">${this.esc(summary)}</div>
                    </div>

                    <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                        <div class="text-sm font-medium text-blue-900 mb-2">Что чинить в первую очередь</div>
                        <ul class="list-disc pl-5 text-sm text-blue-900 space-y-1">
                            ${priorities.map(item => `<li>${this.esc(item)}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border p-6">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Ключевые метрики</h4>

                    <div class="space-y-4">
                        <div class="p-3 bg-gray-50 rounded-lg">
                            <div class="text-sm text-gray-600">Прибыль (сценарии)</div>
                            <div class="mt-2 grid grid-cols-3 gap-2 text-sm">
                                <div>
                                    <div class="text-xs text-gray-500">песс.</div>
                                    <div class="font-semibold">${this.fmtMoney(profit.pessimistic)}</div>
                                </div>
                                <div>
                                    <div class="text-xs text-gray-500">база</div>
                                    <div class="font-semibold">${this.fmtMoney(profit.typical)}</div>
                                </div>
                                <div>
                                    <div class="text-xs text-gray-500">опт.</div>
                                    <div class="font-semibold">${this.fmtMoney(profit.optimistic)}</div>
                                </div>
                            </div>
                            <div class="mt-2 text-xs text-gray-500">средняя: <span class="font-semibold text-gray-900">${this.fmtMoney(profitAvg)}</span></div>
                        </div>

                        <div class="p-3 bg-yellow-50 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="text-sm text-yellow-900">FogI ("не знаю")</div>
                                    <div class="text-xs text-yellow-800">чем выше — тем хуже</div>
                                </div>
                                <div class="text-2xl font-bold text-yellow-800">${d.premortem.fogi}%</div>
                            </div>
                            <div class="mt-2 w-full bg-yellow-200 rounded-full h-2">
                                <div class="bg-yellow-500 h-2 rounded-full" style="width:${d.premortem.fogi}%;"></div>
                            </div>
                        </div>

                        <div class="p-3 bg-red-50 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="text-sm text-red-900">IllI (аномалии)</div>
                                    <div class="text-xs text-red-800">чем больше — тем риск выше</div>
                                </div>
                                <div class="text-2xl font-bold text-red-800">${d.premortem.illi}</div>
                            </div>
                        </div>

                        <div class="p-3 bg-blue-50 rounded-lg">
                            <div class="text-sm text-blue-900 font-medium">One-liner</div>
                            <div class="text-sm text-blue-900 mt-2">${this.esc(d.premortem.oneLiner || '—')}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="bg-white rounded-lg shadow-sm border p-6">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Сегменты</h4>
                    ${this.renderMiniBlock(
                        d.segments.active !== 0,
                        {
                            lines: [
                                ['Активных', d.segments.active],
                                ['Средний индекс', d.segments.avgIndex ?? '-'],
                                ['Лучший сегмент', d.segments.top ? `${this.esc(d.segments.top.name)} (${d.segments.top.value})` : '-']
                            ],
                            hint: 'Если сегментов нет — скоринг по рынку пока слепой.'
                        }
                    )}
                    <div class="mt-4 flex gap-2">
                        <button class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm" onclick="window.app && window.app.switchModule('segments')">
                            Открыть модуль
                        </button>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border p-6">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Операции</h4>
                    ${this.renderMiniBlock(
                        d.operations.total !== 0,
                        {
                            lines: [
                                ['Сценариев', d.operations.total],
                                ['Средний индекс', d.operations.avgIndex ?? '-'],
                                ['Слабое место', d.operations.worst ? `${this.esc(d.operations.worst.name)} (${d.operations.worst.value})` : '-']
                            ],
                            hint: 'Если спрос > мощность — очередь уходит в ∞. Это не "плохо", это сигнал.'
                        }
                    )}
                    <div class="mt-4 flex gap-2">
                        <button class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm" onclick="window.app && window.app.switchModule('operations')">
                            Открыть модуль
                        </button>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border p-6">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Портфель</h4>
                    ${this.renderMiniBlock(
                        d.portfolio.total !== 0,
                        {
                            lines: [
                                ['Идей', d.portfolio.total],
                                ['Индекс', d.portfolio.index ?? '-'],
                                ['Средний риск', d.portfolio.avgRisk == null ? '-' : d.portfolio.avgRisk.toFixed(2)],
                                ['Средняя нагрузка', d.portfolio.avgLoad == null ? '-' : d.portfolio.avgLoad.toFixed(2)],
                                ['Среднее время (мес.)', d.portfolio.avgTime == null ? '-' : d.portfolio.avgTime.toFixed(1)]
                            ],
                            hint: 'Симуляция — это не прогноз. Это проверка, насколько портфель хрупкий.'
                        }
                    )}

                    ${d.portfolio.simulation ? `
                        <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div class="text-sm font-medium text-gray-700 mb-2">Симуляция (500 прогонов)</div>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div><span class="text-gray-600">Mean:</span> <span class="font-medium">${this.fmtMoney(d.portfolio.simulation.mean)}</span></div>
                                <div><span class="text-gray-600">Std:</span> <span class="font-medium">${this.fmtMoney(d.portfolio.simulation.std)}</span></div>
                                <div><span class="text-gray-600">VaR95:</span> <span class="font-medium">${this.fmtMoney(d.portfolio.simulation.var)}</span></div>
                                <div><span class="text-gray-600">CVaR95:</span> <span class="font-medium">${this.fmtMoney(d.portfolio.simulation.cvar)}</span></div>
                            </div>
                        </div>
                    ` : ''}

                    <div class="mt-4 flex gap-2">
                        <button class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm" onclick="window.app && window.app.switchModule('portfolio')">
                            Открыть модуль
                        </button>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border p-6">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <h4 class="text-lg font-semibold text-gray-900">План действий</h4>
                        <p class="text-gray-600 text-sm">${d.plan.steps.length ? `Шагов: ${d.plan.steps.length}, всего: ${d.plan.totalDays} дней` : 'План пока пустой — это нормально, если проект на раннем этапе.'}</p>
                    </div>
                    <button class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm" onclick="window.app && window.app.switchModule('premortem')">
                        <i class="fas fa-brain mr-1"></i>Открыть Premortem
                    </button>
                </div>

                ${d.plan.steps.length ? `
                    <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        ${d.plan.steps.map((s, idx) => `
                            <div class="p-3 bg-gray-50 rounded-lg">
                                <div class="text-sm font-medium text-gray-900">${idx + 1}. ${this.esc((s?.step || '').trim() || '—')}</div>
                                <div class="text-xs text-gray-600 mt-1">Срок: ${NumberUtils.safeNumber(s?.duration, 0)} дн.</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderMiniBlock(hasData, opts) {
        if (!hasData) {
            return `
                <div class="p-3 bg-gray-50 rounded-lg">
                    <div class="text-sm text-gray-700">Нет данных</div>
                    <div class="text-xs text-gray-500 mt-1">${this.esc(opts?.hint || '')}</div>
                </div>
            `;
        }

        const lines = Array.isArray(opts?.lines) ? opts.lines : [];

        return `
            <div class="space-y-2">
                ${lines.map(([k, v]) => `
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600">${this.esc(k)}</span>
                        <span class="font-medium text-gray-900">${this.esc(String(v))}</span>
                    </div>
                `).join('')}
                ${opts?.hint ? `<div class="text-xs text-gray-500 mt-2">${this.esc(opts.hint)}</div>` : ''}
            </div>
        `;
    }

    // ---------- Copy / Summary ----------

    buildCopyText() {
        const d = this.collect();
        const v = this.verdictMeta(d.premortem.finalVerdict);
        const profit = d.premortem.profit;
        const profitAvg = Math.round((profit.pessimistic + profit.typical + profit.optimistic) / 3);
        const priorities = this.buildPriorityFixes(d);

        const lines = [
            `PREMORTEM HUB — отчёт: ${d.project.name}`,
            `Вердикт: ${v.text}${d.premortem.finalReason ? ` — ${d.premortem.finalReason}` : ''}`,
            `Прибыль (песс/база/опт): ${profit.pessimistic}/${profit.typical}/${profit.optimistic} (средняя ${profitAvg})`,
            `FogI: ${d.premortem.fogi}% | IllI: ${d.premortem.illi}`,
            `Сегменты: ${d.segments.active ?? 0} акт., ср.индекс ${d.segments.avgIndex ?? '-'}`,
            `Операции: ${d.operations.total ?? 0} сцен., ср.индекс ${d.operations.avgIndex ?? '-'}`,
            `Портфель: ${d.portfolio.total ?? 0} идей, индекс ${d.portfolio.index ?? '-'}`,
            `План: ${d.plan.steps.length} шагов, ${d.plan.totalDays} дней`,
            `Главные правки: ${priorities.join('; ')}`,
            '',
            this.buildSummary(d)
        ];

        return lines.join('\n');
    }

    buildSummary(d) {
        const profit = d.premortem.profit;
        const profitAvg = Math.round((profit.pessimistic + profit.typical + profit.optimistic) / 3);

        const weak = this.findWeakest(d);

        const parts = [];

        // 1) What it is
        if (d.premortem.oneLiner) {
            parts.push(`Суть: ${d.premortem.oneLiner}`);
        } else {
            parts.push('Суть: one-liner не выбран — это легко чинится (выбери лучшую формулировку).');
        }

        // 2) Decision logic
        parts.push(`Финансы: средняя прибыль ≈ ${this.fmtMoney(profitAvg)} (песс ${this.fmtMoney(profit.pessimistic)}, база ${this.fmtMoney(profit.typical)}, опт ${this.fmtMoney(profit.optimistic)}).`);
        parts.push(`Неизвестность: FogI = ${d.premortem.fogi}% (это доля "не знаю").`);
        parts.push(`Аномалии: IllI = ${d.premortem.illi} (отмеченные риски/аномалии).`);

        // 3) Weakest link
        if (weak) {
            parts.push(`Слабое место сейчас: ${weak.name} (${weak.value}/100).`);
        }

        // 4) Action nudge
        if (d.plan.steps.length === 0) {
            parts.push('Следующий шаг: набросай 5–7 шагов плана — это сразу снижает туман и делает проект "земным".');
        } else {
            parts.push(`План есть: ${d.plan.steps.length} шагов на ~${d.plan.totalDays} дней. Главное — начать с шага №1 и довести до факта.`);
        }

        return parts.join('\n');
    }

    buildPriorityFixes(d) {
        const profit = d.premortem.profit;
        const profitAvg = Math.round((profit.pessimistic + profit.typical + profit.optimistic) / 3);

        const fixes = [];

        if (profitAvg < 0) {
            fixes.push('Экономика в минус — пересмотреть цену, спрос или расходы.');
        }

        if (d.premortem.fogi > 40) {
            fixes.push('Снизить FogI: собрать факты по самым туманным пунктам.');
        }

        if (d.segments.avgIndex != null && d.segments.avgIndex < 50) {
            fixes.push('Уточнить сегменты: выбрать 1–2 наиболее живых группы и проверить спрос.');
        }

        if (d.operations.avgIndex != null && d.operations.avgIndex < 50) {
            fixes.push('Операции: увеличить мощность или уменьшить поток, чтобы ρ < 0.9.');
        }

        if (d.portfolio.index != null && d.portfolio.index < 50) {
            fixes.push('Портфель: убрать слабые идеи или перераспределить доли.');
        }

        if (!fixes.length) {
            fixes.push('Критичных дыр не видно — двигайтесь по плану и тестируйте гипотезы.');
        }

        return fixes.slice(0, 3);
    }

    findWeakest(d) {
        const items = [];

        // Premortem score (converted)
        items.push({ name: 'Premortem', value: this.verdictScore(d.premortem.finalVerdict) });

        if (d.segments.avgIndex != null) items.push({ name: 'Сегменты', value: this.clamp100(d.segments.avgIndex) });
        if (d.operations.avgIndex != null) items.push({ name: 'Операции', value: this.clamp100(d.operations.avgIndex) });
        if (d.portfolio.index != null) items.push({ name: 'Портфель', value: this.clamp100(d.portfolio.index) });

        if (items.length === 0) return null;
        return items.slice().sort((a, b) => a.value - b.value)[0];
    }

    // ---------- HUB score ----------

    calculateHubIndex({ finalVerdict, avgSeg, avgOps, portfolioIndex }) {
        const premScore = this.verdictScore(finalVerdict);
        const components = [];

        // Premortem always present
        components.push({ key: 'premortem', name: 'Premortem', value: premScore, weight: 0.5 });

        const others = [];
        if (avgSeg != null) others.push({ key: 'segments', name: 'Сегменты', value: this.clamp100(avgSeg) });
        if (avgOps != null) others.push({ key: 'operations', name: 'Операции', value: this.clamp100(avgOps) });
        if (portfolioIndex != null) others.push({ key: 'portfolio', name: 'Портфель', value: this.clamp100(portfolioIndex) });

        const otherWeight = others.length ? 0.5 / others.length : 0;
        others.forEach(o => components.push({ ...o, weight: otherWeight }));

        const score = Math.round(components.reduce((s, c) => s + c.value * c.weight, 0));

        const meta = this.scoreMeta(score);
        return { score, ...meta, components };
    }

    scoreMeta(score) {
        if (score >= 75) return { label: 'Готово к движению', className: 'text-green-700' };
        if (score >= 50) return { label: 'Нужно усилить', className: 'text-yellow-700' };
        if (score >= 25) return { label: 'Хрупко, опасно', className: 'text-orange-700' };
        return { label: 'Не готово', className: 'text-red-700' };
    }

    verdictScore(status) {
        switch (status) {
            case 'proceed': return 100;
            case 'review': return 70;
            case 'pause': return 40;
            case 'kill': return 0;
            default: return 60;
        }
    }

    verdictMeta(status) {
        switch (status) {
            case 'proceed':
                return { text: 'Запускать', icon: 'fas fa-circle-check', cardClass: 'bg-green-50 text-green-900' };
            case 'review':
                return { text: 'Доработать', icon: 'fas fa-screwdriver-wrench', cardClass: 'bg-yellow-50 text-yellow-900' };
            case 'pause':
                return { text: 'Пауза', icon: 'fas fa-circle-pause', cardClass: 'bg-orange-50 text-orange-900' };
            case 'kill':
                return { text: 'Закрыть', icon: 'fas fa-circle-xmark', cardClass: 'bg-red-50 text-red-900' };
            default:
                return { text: 'Доработать', icon: 'fas fa-screwdriver-wrench', cardClass: 'bg-yellow-50 text-yellow-900' };
        }
    }

    getSelectedOneLiner(p) {
        const oneLiners = Array.isArray(p?.oneLiners) ? p.oneLiners : [];
        const idx = Number.isFinite(p?.selectedOneLiner) ? p.selectedOneLiner : 0;
        return (oneLiners[idx] || '').trim();
    }

    // ---------- Utils ----------

    fmtMoney(n) {
        const v = NumberUtils.safeNumber(n, 0);
        return NumberUtils.formatNumber(Math.round(v)) + ' ₽';
    }

    clamp100(n) {
        const v = NumberUtils.safeNumber(n, 0);
        return Math.max(0, Math.min(100, Math.round(v)));
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

    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return;
            }
        } catch (_) { /* ignore */ }

        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (_) { /* ignore */ }
        document.body.removeChild(ta);
    }

    flashButton(btn, html) {
        if (!btn) return;
        const orig = btn.innerHTML;
        btn.innerHTML = html;
        btn.disabled = true;
        setTimeout(() => {
            btn.innerHTML = orig;
            btn.disabled = false;
        }, 1200);
    }
}

window.Report = Report;
