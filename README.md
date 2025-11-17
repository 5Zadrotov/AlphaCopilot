# AlphaCopilot Development Setup

## Быстрый старт

### ⚠️ Предварительная настройка

Перед запуском создайте `.env` файл:

```bash
cp .env.example .env
```

Отредактируйте `.env` и добавьте ваш OpenRouter API ключ:
```
OpenRouter__ApiKey=sk-or-v1-YOUR_KEY_HERE
```

Подробнее: [SETUP_ENV.md](./SETUP_ENV.md)

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

### Backend (.env)
Используйте переменные окружения для конфиденциальных данных:

| Переменная | Описание |
|-----------|---------|
| `OpenRouter__ApiKey` | API ключ OpenRouter |
| `Jwt__SecretKey` | Секретный ключ для JWT |
| `ConnectionStrings__DefaultConnection` | Строка подключения БД |

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

## Безопасность

- ✅ API ключи хранятся в `.env` (не в гите)
- ✅ `.env` добавлен в `.gitignore`
- ✅ Используйте разные ключи для dev и production
- ✅ Регулярно ротируйте ключи
