// Утилита для экспорта/импорта данных
class ExportImport {
    static exportProject(project) {
        if (!project || !project.name) {
            alert('Нет данных для экспорта');
            return;
        }
        const dataStr = JSON.stringify(project, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    static exportAll() {
        const data = Storage.load();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `premortem_hub_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    static importProject(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('Файл не выбран'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    if (!e.target.result) {
                        reject(new Error('Файл пустой'));
                        return;
                    }

                    const data = JSON.parse(e.target.result);
                    const now = new Date().toISOString();

                    // Если это единичный проект
                    if (data && typeof data === 'object' && data.name && !data.projects) {
                        const normalized = Storage.normalizeProject(data).project;
                        normalized.id = Storage.generateId();
                        normalized.createdAt = now;
                        normalized.updatedAt = now;
                        Storage.saveProject(normalized);
                        resolve(normalized);
                        return;
                    }

                    // Если это полный бэкап
                    if (data && Array.isArray(data.projects)) {
                        const current = Storage.load();
                        const imported = [];

                        data.projects.forEach(project => {
                            const normalized = Storage.normalizeProject(project).project;
                            normalized.id = Storage.generateId();
                            normalized.createdAt = now;
                            normalized.updatedAt = now;
                            current.projects.push(normalized);
                            imported.push(normalized);
                        });

                        Storage.save(current);
                        resolve(imported);
                        return;
                    }

                    reject(new Error('Неверный формат файла'));
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Ошибка чтения файла'));
            reader.readAsText(file);
        });
    }

    static createImportInput() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        document.body.appendChild(input);
        return input;
    }
}

// Экспорт для использования в других модулях
window.ExportImport = ExportImport;
