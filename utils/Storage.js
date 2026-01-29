// Утилита для работы с localStorage
class Storage {
    static KEY = 'premortem-hub';
    
    static load() {
        try {
            const data = localStorage.getItem(this.KEY);
            return data ? JSON.parse(data) : { projects: [] };
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
        return data.projects.find(p => p.id === id);
    }
    
    static saveProject(project) {
        const data = this.load();
        const index = data.projects.findIndex(p => p.id === project.id);
        
        if (index >= 0) {
            data.projects[index] = { ...project, updatedAt: new Date().toISOString() };
        } else {
            data.projects.push({ ...project, createdAt: new Date().toISOString() });
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
}

// Экспорт для использования в других модулях
window.Storage = Storage;