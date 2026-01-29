// Модуль Сегменты
class Segments {
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
        if (!this.project.segments || !this.project.segments.segments) return 1;
        return Math.max(...this.project.segments.segments.map(s => s.id), 0) + 1;
    }

    bindEvents() {
        const addBtn = document.getElementById('addSegment');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addSegment());
        }
    }

    render() {
        this.renderSegmentsTable();
        this.updateStats();
    }

    renderSegmentsTable() {
        const tbody = document.getElementById('segmentsTable');
        const segments = this.project.segments?.segments || [];

        if (!tbody) return;

        if (segments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-8 text-gray-500">
                        <i class="fas fa-chart-pie text-4xl mb-4"></i>
                        <p>Нет сегментов. Добавьте первый сегмент для анализа.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = segments.map(segment => this.renderSegmentRow(segment)).join('');
        this.bindSegmentEvents();
    }

    renderSegmentRow(segment) {
        return `
            <tr class="border-b hover:bg-gray-50" data-segment-id="${segment.id}">
                <td class="py-3">
                    <input
                        type="checkbox"
                        class="segment-check"
                        ${segment.checked ? 'checked' : ''}
                        onchange="app.modules.segments.toggleSegment(${segment.id})"
                    />
                </td>
                <td class="py-3">
                    <input
                        type="text"
                        class="segment-name w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        value="${segment.name || ''}"
                        placeholder="Название сегмента"
                        onchange="app.modules.segments.updateSegment(${segment.id}, 'name', this.value)"
                    />
                </td>
                <td class="py-3">
                    <input
                        type="number"
                        class="segment-volume w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        value="${NumberUtils.safeNumber(segment.volume, 0)}"
                        min="0"
                        onchange="app.modules.segments.updateSegment(${segment.id}, 'volume', NumberUtils.toFloatOrNull(this.value))"
                    />
                </td>
                <td class="py-3">
                    <input
                        type="number"
                        class="segment-frequency w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        value="${NumberUtils.safeNumber(segment.frequency, 1)}"
                        min="1"
                        max="365"
                        onchange="app.modules.segments.updateSegment(${segment.id}, 'frequency', NumberUtils.toFloatOrNull(this.value))"
                    />
                </td>
                <td class="py-3">
                    <input
                        type="number"
                        class="segment-accessibility w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        value="${NumberUtils.clamp(segment.metrics?.accessibility, 1, 5, 3)}"
                        min="1"
                        max="5"
                        onchange="app.modules.segments.updateMetric(${segment.id}, 'accessibility', NumberUtils.toFloatOrNull(this.value))"
                    />
                </td>
                <td class="py-3">
                    <input
                        type="number"
                        class="segment-willingness w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        value="${NumberUtils.clamp(segment.metrics?.willingness, 1, 5, 3)}"
                        min="1"
                        max="5"
                        onchange="app.modules.segments.updateMetric(${segment.id}, 'willingness', NumberUtils.toFloatOrNull(this.value))"
                    />
                </td>
                <td class="py-3">
                    <input
                        type="number"
                        class="segment-pain w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        value="${NumberUtils.clamp(segment.metrics?.pain, 1, 5, 3)}"
                        min="1"
                        max="5"
                        onchange="app.modules.segments.updateMetric(${segment.id}, 'pain', NumberUtils.toFloatOrNull(this.value))"
                    />
                </td>
                <td class="py-3">
                    <input
                        type="number"
                        class="segment-reach w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        value="${NumberUtils.clamp(segment.metrics?.reach, 1, 5, 3)}"
                        min="1"
                        max="5"
                        onchange="app.modules.segments.updateMetric(${segment.id}, 'reach', NumberUtils.toFloatOrNull(this.value))"
                    />
                </td>
                <td class="py-3">
                    <span class="segment-index font-bold text-blue-600">${segment.index || 0}</span>
                </td>
                <td class="py-3">
                    <button
                        onclick="app.modules.segments.deleteSegment(${segment.id})"
                        class="text-red-500 hover:text-red-700 transition-colors"
                        title="Удалить"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    bindSegmentEvents() {
        // Events are bound through inline onclick handlers
    }

    addSegment() {
        if (!this.project.segments) {
            this.project.segments = { segments: [] };
        }
        const segments = this.project.segments.segments || [];
        const newSegment = {
            id: this.nextId++,
            name: `Сегмент ${segments.length + 1}`,
            volume: 1000,
            frequency: 12,
            checked: true,
            metrics: {
                accessibility: 3,
                willingness: 3,
                pain: 3,
                reach: 3
            },
            index: 0
        };

        segments.push(newSegment);
        this.updateSegmentIndex(newSegment);

        if (!this.project.segments) {
            this.project.segments = { segments: [] };
        }
        this.project.segments.segments = segments;

        this.render();
        if (window.app) window.app.persistProject(true);
    }

    deleteSegment(id) {
        if (!confirm('Удалить сегмент?')) return;

        const segments = this.project.segments?.segments || [];
        this.project.segments.segments = segments.filter(s => s.id !== id);
        this.render();
        if (window.app) window.app.persistProject(true);
    }

    toggleSegment(id) {
        const segment = this.findSegment(id);
        if (segment) {
            segment.checked = !segment.checked;
            this.updateSegmentIndex(segment);
            this.render();
            if (window.app) window.app.persistProject(true);
        }
    }

    updateSegment(id, field, value) {
        const segment = this.findSegment(id);
        if (segment) {
            if (field === 'name') {
                segment[field] = String(value || '').trim();
            } else {
                segment[field] = NumberUtils.safeNumber(value, 0);
            }
            this.updateSegmentIndex(segment);

            // Update index in the row without full rerender
            const row = document.querySelector(`[data-segment-id="${id}"]`);
            const idxEl = row ? row.querySelector('.segment-index') : null;
            if (idxEl) idxEl.textContent = segment.index;

            this.updateStats();
            if (window.app) window.app.persistProject(true);
        }
    }

    updateMetric(id, metric, value) {
        const segment = this.findSegment(id);
        if (segment && segment.metrics) {
            segment.metrics[metric] = NumberUtils.clamp(value, 1, 5, 3);
            this.updateSegmentIndex(segment);
            this.renderSegmentsTable();
            this.updateStats();
            if (window.app) window.app.persistProject(true);
        }
    }

    findSegment(id) {
        const segments = this.project.segments?.segments || [];
        return segments.find(s => s.id === id);
    }

    updateSegmentIndex(segment) {
        segment.index = Calculators.calculateSegmentIndex(segment);
    }

    updateStats() {
        const segments = this.project.segments?.segments || [];
        const activeSegments = segments.filter(s => s.checked);

        // Update count
        const countEl = document.getElementById('segmentCount');
        if (countEl) countEl.textContent = segments.length;

        // Update average index
        const averageEl = document.getElementById('averageSegmentIndex');
        if (averageEl && activeSegments.length > 0) {
            const average = Math.round(activeSegments.reduce((sum, s) => sum + NumberUtils.safeNumber(s.index, 0), 0) / activeSegments.length);
            averageEl.textContent = average;
        } else if (averageEl) {
            averageEl.textContent = '0';
        }
    }

    save() {
        return this.project;
    }

    refresh() {
        this.render();
    }
}
