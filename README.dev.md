# AlphaCopilot Development Setup

## Быстрый старт

### Dev режим (с hot reload)
```bash
make dev
# или
docker-compose -f docker-compose.dev.yml up --build
```

### Production режим
```bash
make prod
# или
docker-compose up --build
```

## Структура

- **Frontend**: React + Vite на порту 3000
- **Backend**: ASP.NET Core на порту 8080  
- **Database**: PostgreSQL на порту 5432
- **Nginx**: Reverse proxy на порту 80

## API Endpoints

Frontend автоматически проксирует `/api/*` запросы на backend через nginx.

## Переменные окружения

### Frontend (.env.development)
```
VITE_API_URL=http://localhost:8080
```

## Полезные команды

```bash
make logs    # Логи всех сервисов
make clean   # Остановить и очистить
make restart # Перезапуск
```