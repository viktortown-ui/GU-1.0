// Главный файл приложения
class PremortemHub {
    constructor() {
        this.currentProject = null;
        this.currentModule = 'premortem';
        this.modules = {};
        this.themeStorageKey = 'premortem-theme';
        this.currentTheme = 'light';

        this.init();
    }

    init() {
        this.determinePage();
        this.initTheme();
        this.bindEvents();

        if (this.isAppPage()) {
            this.loadProject();
            this.initModules();
            this.collapseInfoCardsOnMobile();
        } else {
            this.loadProjectsList();
        }
    }

    determinePage() {
        const path = window.location.pathname;
        this.page = path.includes('app.html') ? 'app' : 'index';
    }

    isAppPage() {
        return this.page === 'app';
    }

    bindEvents() {
        if (this.isAppPage()) {
            this.bindAppEvents();
        } else {
            this.bindIndexEvents();
        }

        // Инструкция (help modal) доступна на обеих страницах
        this.bindHelpEvents();
    }

    initTheme() {
        const saved = localStorage.getItem(this.themeStorageKey);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        const theme = saved || (prefersDark.matches ? 'dark' : 'light');

        this.applyTheme(theme, !!saved);

        prefersDark.addEventListener('change', (event) => {
            if (localStorage.getItem(this.themeStorageKey)) return;
            this.applyTheme(event.matches ? 'dark' : 'light', false);
        });

        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleTheme());
        }
    }

    applyTheme(theme, persist = true) {
        this.currentTheme = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.dataset.theme = this.currentTheme;
        if (persist) {
            localStorage.setItem(this.themeStorageKey, this.currentTheme);
        }
        this.updateThemeToggle();
    }

    toggleTheme() {
        const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(nextTheme, true);
    }

    updateThemeToggle() {
        const toggleBtn = document.getElementById('themeToggle');
        if (!toggleBtn) return;

        const label = toggleBtn.querySelector('.theme-toggle-label');
        const icon = toggleBtn.querySelector('i');
        if (label) {
            label.textContent = this.currentTheme === 'dark' ? 'Светлая' : 'Тёмная';
        }
        if (icon) {
            icon.classList.remove('fa-sun', 'fa-moon');
            icon.classList.add(this.currentTheme === 'dark' ? 'fa-sun' : 'fa-moon');
        }
    }

    bindHelpEvents() {
        const helpBtn = document.getElementById('helpBtn');
        const helpModal = document.getElementById('helpModal');
        const helpCloseBtn = document.getElementById('helpCloseBtn');

        if (!helpModal) return;

        const open = () => this.showHelpModal();
        const close = () => this.hideHelpModal();
        const toggle = () => (this.isHelpOpen() ? close() : open());

        if (helpBtn) helpBtn.addEventListener('click', open);
        if (helpCloseBtn) helpCloseBtn.addEventListener('click', close);

        // Закрытие по клику в затемнение
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) close();
        });

        // Навигация внутри инструкции
        document.querySelectorAll('.help-nav').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const target = document.getElementById(targetId);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        // Горячие клавиши
        document.addEventListener('keydown', (e) => {
            // Не мешаем вводу текста
            if (this.isTypingContext()) {
                // Esc всё равно должен закрывать
                if (e.key === 'Escape' && this.isHelpOpen()) {
                    e.preventDefault();
                    close();
                }
                return;
            }

            if (e.key === 'Escape' && this.isHelpOpen()) {
                e.preventDefault();
                close();
                return;
            }

            // '?' (Shift + /)
            if (e.key === '?') {
                e.preventDefault();
                toggle();
            }
        });
    }

    isHelpOpen() {
        const helpModal = document.getElementById('helpModal');
        return !!helpModal && !helpModal.classList.contains('hidden');
    }

    showHelpModal() {
        const helpModal = document.getElementById('helpModal');
        if (!helpModal) return;
        helpModal.classList.remove('hidden');
    }

    hideHelpModal() {
        const helpModal = document.getElementById('helpModal');
        if (!helpModal) return;
        helpModal.classList.add('hidden');
    }

    isTypingContext() {
        const el = document.activeElement;
        if (!el) return false;
        const tag = (el.tagName || '').toUpperCase();
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
        if (el.isContentEditable) return true;
        return false;
    }

    bindIndexEvents() {
        // Создание проекта
        const createBtn = document.getElementById('createFirstBtn');
        const createProjectBtn = document.getElementById('createProjectBtn');
        const createModal = document.getElementById('createModal');
        const closeModal = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const createForm = document.getElementById('createForm');

        [createBtn, createProjectBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => this.showCreateModal());
            }
        });

        if (closeModal) closeModal.addEventListener('click', () => this.hideCreateModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideCreateModal());
        if (createForm) createForm.addEventListener('submit', (e) => this.handleCreateProject(e));

        // Экспорт/импорт
        const importBtn = document.getElementById('importBtn');
        const exportAllBtn = document.getElementById('exportAllBtn');

        if (importBtn) {
            importBtn.addEventListener('click', () => this.handleImport());
        }
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', () => ExportImport.exportAll());
        }
    }

    bindAppEvents() {
        // Навигация по модулям
        document.querySelectorAll('.module-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const module = e.target.closest('.module-tab').dataset.module;
                this.switchModule(module);
            });
        });

        document.querySelectorAll('.bottom-nav__item').forEach(item => {
            item.addEventListener('click', () => {
                const target = item.dataset.module;
                if (target === 'analysis') {
                    const next = this.currentModule === 'segments' ? 'operations' : 'segments';
                    this.switchModule(next);
                    return;
                }
                this.switchModule(target);
            });
        });

        // Сохранение и экспорт
        const saveBtn = document.getElementById('saveProjectBtn');
        const exportBtn = document.getElementById('exportProjectBtn');

        if (saveBtn) saveBtn.addEventListener('click', () => this.saveProject());
        if (exportBtn) exportBtn.addEventListener('click', () => ExportImport.exportProject(this.currentProject));

        window.addEventListener('beforeunload', () => this.persistProject(true));
    }

    collapseInfoCardsOnMobile() {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (!isMobile) return;
        document.querySelectorAll('.info-card').forEach(card => {
            card.removeAttribute('open');
        });
    }

    showCreateModal() {
        const modal = document.getElementById('createModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('projectName').focus();
        }
    }

    hideCreateModal() {
        const modal = document.getElementById('createModal');
        if (modal) {
            modal.classList.add('hidden');
            document.getElementById('createForm').reset();
        }
    }

    handleCreateProject(e) {
        e.preventDefault();

        const name = document.getElementById('projectName').value.trim();
        const description = document.getElementById('projectDescription').value.trim();

        if (!name) return;

        const project = Storage.createProject(name, description);
        Storage.saveProject(project);

        this.hideCreateModal();
        window.location.href = `app.html?project=${project.id}`;
    }

    createDefaultProject(name, description = '') {
        return Storage.createProject(name, description);
    }

    loadProjectsList() {
        const data = Storage.load();
        const projectsList = document.getElementById('projectsList');
        const welcomeBlock = document.getElementById('welcomeBlock');
        const projectsSection = document.getElementById('projectsSection');

        if (!projectsList) return;

        if (data.projects.length === 0) {
            if (welcomeBlock) welcomeBlock.classList.remove('hidden');
            if (projectsSection) projectsSection.classList.add('hidden');
            return;
        }

        if (welcomeBlock) welcomeBlock.classList.add('hidden');
        if (projectsSection) projectsSection.classList.remove('hidden');

        projectsList.innerHTML = data.projects.map(project => this.renderProjectCard(project)).join('');

        // Bind project events
        this.bindProjectEvents();
    }

    renderProjectCard(project) {
        const updated = new Date(project.updatedAt).toLocaleDateString('ru-RU');

        return `
            <div class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div class="p-6">
                    <div class="flex items-start justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900 line-clamp-2">${project.name}</h3>
                        <div class="flex space-x-1">
                            <button onclick="app.duplicateProject('${project.id}')" class="text-gray-400 hover:text-gray-600 transition-colors" title="Копировать">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button onclick="app.deleteProject('${project.id}')" class="text-gray-400 hover:text-red-600 transition-colors" title="Удалить">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>

                    ${project.description ? `<p class="text-gray-600 text-sm mb-4 line-clamp-2">${project.description}</p>` : ''}

                    <div class="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span>Обновлено: ${updated}</span>
                    </div>

                    <div class="flex space-x-2">
                        <a href="app.html?project=${project.id}" class="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            Открыть
                        </a>
                        <button onclick="ExportImport.exportProject(app.getProject('${project.id}'))" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                            Экспорт
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    bindProjectEvents() {
        // Projects are already bound through onclick attributes
    }

    duplicateProject(id) {
        Storage.duplicateProject(id);
        this.loadProjectsList();
    }

    deleteProject(id) {
        if (confirm('Удалить проект? Это действие нельзя отменить.')) {
            Storage.deleteProject(id);
            this.loadProjectsList();
        }
    }

    getProject(id) {
        return Storage.getProject(id);
    }

    handleImport() {
        const input = ExportImport.createImportInput();
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                ExportImport.importProject(file)
                    .then(() => {
                        this.loadProjectsList();
                        alert('Проект успешно импортирован!');
                    })
                    .catch(error => {
                        alert('Ошибка импорта: ' + error.message);
                    });
            }
            document.body.removeChild(input);
        };
        input.click();
    }

    // App page methods
    loadProject() {
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('project');

        if (!projectId) {
            window.location.href = 'index.html';
            return;
        }

        this.currentProject = Storage.getProject(projectId);
        if (!this.currentProject) {
            window.location.href = 'index.html';
            return;
        }

        // Update UI
        const titleEl = document.getElementById('projectTitle');
        const updatedEl = document.getElementById('projectUpdated');

        if (titleEl) titleEl.textContent = this.currentProject.name;
        if (updatedEl) {
            const updated = new Date(this.currentProject.updatedAt).toLocaleString('ru-RU');
            updatedEl.textContent = `Обновлено: ${updated}`;
        }
    }

    initModules() {
        // Initialize all modules
        this.modules.premortem = new PremortemLite(this.currentProject);
        this.modules.report = new Report(this.currentProject);
        this.modules.segments = new Segments(this.currentProject);
        this.modules.operations = new Operations(this.currentProject);
        this.modules.portfolio = new Portfolio(this.currentProject);

        // Show first module
        this.switchModule('premortem');
    }

    switchModule(moduleName) {
        if (!this.modules[moduleName]) return;

        if (this.modules[this.currentModule]) {
            this.currentProject = this.modules[this.currentModule].save();
            this.persistProject(true);
        }

        // Update tabs
        document.querySelectorAll('.module-tab').forEach(tab => {
            tab.classList.remove('border-blue-600', 'text-blue-600');
            tab.classList.add('border-transparent', 'text-gray-500');
        });

        const activeTab = document.querySelector(`[data-module="${moduleName}"]`);
        if (activeTab) {
            activeTab.classList.remove('border-transparent', 'text-gray-500');
            activeTab.classList.add('border-blue-600', 'text-blue-600');
        }

        // Update content
        document.querySelectorAll('.module-content').forEach(content => {
            content.classList.add('hidden');
        });

        const activeContent = document.getElementById(`${moduleName}-module`);
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }

        this.currentModule = moduleName;

        document.querySelectorAll('.bottom-nav__item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.module === moduleName) {
                item.classList.add('active');
            }
            if (item.dataset.module === 'analysis' && (moduleName === 'segments' || moduleName === 'operations')) {
                item.classList.add('active');
            }
        });

        // Refresh module data
        if (this.modules[moduleName]) {
            this.modules[moduleName].refresh();
        }
    }

    saveProject() {
        if (!this.currentProject) return;

        // Collect data from current module
        if (this.modules[this.currentModule]) {
            this.currentProject = this.modules[this.currentModule].save();
        }

        this.currentProject.updatedAt = new Date().toISOString();
        Storage.saveProject(this.currentProject);

        // Update UI
        const updatedEl = document.getElementById('projectUpdated');
        if (updatedEl) {
            const updated = new Date(this.currentProject.updatedAt).toLocaleString('ru-RU');
            updatedEl.textContent = `Обновлено: ${updated}`;
        }

        // Show success feedback
        this.showSaveFeedback();
    }

    persistProject(silent = true) {
        if (!this.currentProject) return;
        Storage.saveProject(this.currentProject);
        if (!silent) {
            this.showSaveFeedback();
        }
    }

    showSaveFeedback() {
        const saveBtn = document.getElementById('saveProjectBtn');
        if (!saveBtn) return;

        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-check mr-1"></i>Сохранено';
        saveBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        saveBtn.classList.add('bg-green-600');

        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.classList.remove('bg-green-600');
            saveBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }, 2000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PremortemHub();
});
