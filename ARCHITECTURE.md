# PREMORTEM HUB - Архитектура приложения

## A) Описание приложения одной фразой

**PREMORTEM HUB** — это offline-first веб-приложение для предпроектной аналитики и планирования, которое помогает системно оценивать идеи, сегментировать рынки, анализировать операционную устойчивость и управлять портфелем проектов с локальным хранением данных.

## B) Стек технологий

### Frontend:
- **Чистый HTML5** — разметка без фреймворков
- **Vanilla JavaScript (ES6+)** — логика без зависимостей
- **CSS3 с Tailwind CSS** — стилизация через CDN
- **LocalStorage** — персистентность данных

### Выбор обоснован:
1. **Максимальная простота** — нет сборки, npm, зависимостей
2. **Offline-first** — работает без интернета после первой загрузки
3. **Кроссплатформенность** — любой современный браузер
4. **Быстрая разработка** — прямое редактирование файлов
5. **Легкость деплоя** — статические файлы

## C) Структура данных (JSON)

```json
{
  "projects": [
    {
      "id": "uuid-123",
      "name": "Название проекта",
      "createdAt": "2025-12-22T10:00:00Z",
      "updatedAt": "2025-12-22T10:30:00Z",
      "premortem": {
        "client": "Описание клиента",
        "problem": "Описание проблемы",
        "solution": "Описание решения",
        "format": "Формат поставки",
        "oneLiners": ["Вариант 1", "Вариант 2", "Вариант 3"],
        "selectedOneLiner": 0,
        "economics": {
          "price": { "min": 100, "typ": 150, "max": 200 },
          "demand": { "min": 50, "typ": 100, "max": 150 },
          "expenses": { "min": 30, "typ": 50, "max": 70 }
        },
        "fogi": {
          "checklist": [
            {"id": 1, "text": "Понятен ли клиент?", "checked": false},
            {"id": 2, "text": "Решена ли проблема?", "checked": true}
          ],
          "percentage": 35
        },
        "illi": {
          "anomalies": [
            {"id": 1, "text": "Аномальный рост спроса", "active": false}
          ]
        },
        "verdict": {
          "status": "proceed|review|pause|kill",
          "reason": "Обоснование решения"
        },
        "plan": [
          {"id": 1, "step": "Шаг 1", "duration": 5},
          {"id": 2, "step": "Шаг 2", "duration": 7}
        ]
      },
      "segments": {
        "segments": [
          {
            "id": 1,
            "name": "Сегмент 1",
            "volume": 1000,
            "frequency": 12,
            "checked": true,
            "metrics": {
              "accessibility": 4,
              "willingness": 3,
              "pain": 5,
              "reach": 4
            },
            "index": 80
          }
        ]
      },
      "operations": {
        "scenarios": [
          {
            "id": 1,
            "name": "Базовый",
            "demand": 100,
            "resources": [
              {"name": "Ресурс 1", "capacity": 120, "reliability": 0.95}
            ],
            "queueMetrics": {"rho": 0.83, "wq": 1.2},
            "index": 85
          }
        ]
      },
      "portfolio": {
        "ideas": [
          {
            "id": 1,
            "name": "Идея 1",
            "revenue": {"base": 100000, "pessimistic": 70000, "optimistic": 150000},
            "risk": 0.3,
            "load": 0.4,
            "time": 6,
            "money": 50000,
            "weight": 0.25,
            "index": 75
          }
        ],
        "simulation": {
          "n": 500,
          "var": 15000,
          "cvar": 25000,
          "portfolioIndex": 78
        }
      }
    }
  ]
}
```

## D) Дерево папок

```
/mnt/okcomputer/output/
├── index.html              # Главная страница со списком проектов
├── app.html               # Рабочая область с модулями
├── main.js                # Точка входа и менеджер проектов
├── modules/
│   ├── PremortemLite.js   # Модуль Premortem Lite
│   ├── Segments.js        # Модуль Сегменты
│   ├── Operations.js      # Модуль Операционная устойчивость
│   └── Portfolio.js       # Модуль Портфель идей
├── utils/
│   ├── Storage.js         # Работа с localStorage
│   ├── ExportImport.js    # Экспорт/импорт JSON
│   └── Calculators.js     # Вспомогательные формулы
└── resources/             # Статические ресурсы
    └── (по необходимости)
```

## E) Архитектурные решения

1. **Модульная система** — каждый модуль = отдельный класс
2. **Единый storage** — все данные в localStorage под ключом 'premortem-hub'
3. **Событийная связь** — модуды общаются через кастомные события
4. **Роутинг без перезагрузки** — hash-based навигация
5. **Автосохранение** — изменения сохраняются немедленно

## F) Формулы и расчеты

### Premortem Lite:
- **Profit scenarios**: P = (Price - Expenses) * Demand
- **FogI**: (Неотмеченные чекбоксы / Всего) * 100
- **Verdict**: Правила на основе экономики и FogI

### Сегменты:
- **Index**: Среднее metrics * (volume/1000) * (frequency/12) * (checked ? 1 : 0.5)

### Операционная устойчивость:
- **ρ (utilization)**: Demand / Sum(Capacity * Reliability)
- **Wq**: (ρ^2) / (2 * μ * (1-ρ)) [M/M/1 approximation]

### Портфель:
- **Monte Carlo**: N=500 симуляций
- **VaR**: 5-й перцентиль распределения
- **CVaR**: Среднее значение хвоста за VaR