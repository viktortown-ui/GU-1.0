// Утилита для экспорта/импорта данных
class ExportImport {
    static exportProject(project) {
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
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Если это единичный проект
                    if (data.name && !data.projects) {
                        data.id = Storage.generateId();
                        data.createdAt = new Date().toISOString();
                        data.updatedAt = new Date().toISOString();
                        Storage.saveProject(data);
                        resolve(data);
                    }
                    // Если это полный бэкап
                    else if (data.projects) {
                        const current = Storage.load();
                        data.projects.forEach(project => {
                            project.id = Storage.generateId();
                            project.createdAt = new Date().toISOString();
                            project.updatedAt = new Date().toISOString();
                            current.projects.push(project);
                        });
                        Storage.save(current);
                        resolve(data.projects);
                    } else {
                        reject(new Error('Неверный формат файла'));
                    }
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