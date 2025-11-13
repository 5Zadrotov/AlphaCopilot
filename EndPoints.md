1. POST api/Auth/register
Тело запроса (JSON):

{
    "FullName": "Иван Иванов",
    "Password": "password123",
    "Email": "test@example.com"
}

Возврат:
    Успех:
    201 Created

{
  "message": "Регистрация прошла успешно",
  "email": "test@example.com"
}

    Неудача:
    409 Conflict (если пользователь уже существует)
    400 Bad Request (валидация)
    500 Internal Server Error (ошибка сервера)

2. POST api/Auth/login
Тело запроса (JSON):

{
  "email": "test@example.com",
  "password": "password123"
}

Возврат:
    Успех:
    200 OK

{
  "token": "<JWT_TOKEN>",
  "email": "test@example.com",
  "displayName": "Иван"
}

    Неудача:
    400 Bad Request (незаполненные поля)
    401 Unauthorized (неверные credentials)

Примечание:
- Полученный JWT нужно передавать в заголовке Authorization для защищённых эндпоинтов:
  `Authorization: Bearer <JWT_TOKEN>`

3. POST api/Session/new
Описание: создать новую чат‑сессию для авторизованного пользователя.
Заголовки:
  Authorization: Bearer <JWT_TOKEN>
Тело запроса (JSON):

{
  "businessType": "Малый бизнес" // опционально
}

Возврат:
    Успех:
    200 OK

{
  "sessionId": "<string GUID>", // строковый идентификатор сессии
  "message": "Новая сессия создана"
}

    Неудача:
    401 Unauthorized (если токен некорректен)
    500 Internal Server Error (ошибка при сохранении)

4. GET api/Session/list
Описание: получить список сессий текущего пользователя.
Заголовки:
  Authorization: Bearer <JWT_TOKEN>
Параметры: нет
Возврат:
    Успех:
    200 OK

[
  {
    "sessionId": "<string GUID>",
    "businessType": "Малый бизнес",
    "selectedCategory": "Общее",
    "startedAt": "2025-11-13T12:34:56Z",
    "lastActivity": "2025-11-13T13:00:00Z",
    "title": "Сессия для Малый бизнес",
    "id": "<GUID>"
  }
]

    Неудача:
    401 Unauthorized
    500 Internal Server Error

5. POST api/Chat/message
Описание: отправить сообщение в сессию (или создать новую) и получить ответ от AI.
Заголовки:
  Authorization: Bearer <JWT_TOKEN>
  Опционально: `Idempotency-Key: <key>` для идемпотентности
Тело запроса (JSON) — ChatMessageRequest:

{
  "content": "Здравствуйте, подскажите, как открыть ИП?",
  "category": "Юридическое", // опционально, по умолчанию "Общее"
  "sessionId": "<string GUID>" // опционально: если не указан, создаётся новая сессия
}

Возврат:
    Успех:
    200 OK

{
  "sessionId": "<string GUID>",
  "userMessage": { /* ChatMessage от пользователя */ },
  "aiMessage": { /* ChatMessage от AI */ }
}

    Неудача:
    400 Bad Request (пустое content)
    401 Unauthorized
    500 Internal Server Error (ошибка AI или сохранения)

Примечания:
- При отправке без `sessionId` сервер создаёт новую сессию и возвращает её `sessionId`.
- Сообщения сохраняются в БД: поля `sessionId` (GUID), `userId` (GUID владельца), `content`, `timestamp`, `isFromUser`, `category`.
- После получения ответа AI создаётся LLM‑лог (в таблицу `LlmLogs`), в логе сохраняется усечённый request/response (обрезаются большие тексты).

6. GET api/Chat/messages
Описание: получить сообщения по `sessionId` с пагинацией.
Заголовки:
  Authorization: Bearer <JWT_TOKEN>
Параметры query:
  `sessionId` (string) — обязательный публичный идентификатор сессии
  `page` (int) — номер страницы, по умолчанию 1
  `pageSize` (int) — размер страницы, по умолчанию 50
Возврат:
    Успех:
    200 OK

{
  "sessionId": "<GUID>",
  "page": 1,
  "pageSize": 50,
  "total": 123,
  "messages": [ /* список ChatMessage, упорядоченных по Timestamp */ ]
}

Ошибки:
    400 Bad Request (если sessionId пуст)
    401 Unauthorized
    404 Not Found (если сессия не найдена)

7. PATCH api/Chat/message/{messageId}
Описание: редактировать собственное сообщение пользователя.
Заголовки:
  Authorization: Bearer <JWT_TOKEN>
Параметры пути: `messageId` (GUID)
Тело запроса:

{
  "content": "Обновлённый текст сообщения"
}

Возврат:
    Успех:
    200 OK — возвращает обновлённое сообщение
    Ошибки:
    400 Bad Request (пустой content или попытка редактировать сообщение от AI)
    401 Unauthorized
    403 Forbid (если пытаться редактировать чужое сообщение)
    404 Not Found (сообщение не найдено)

8. DELETE api/Chat/message/{messageId}
Описание: удалить собственное сообщение.
Заголовки:
  Authorization: Bearer <JWT_TOKEN>
Параметры пути: `messageId` (GUID)
Возврат:
    Успех:
    204 No Content
    Ошибки:
    401 Unauthorized
    403 Forbid (если попытка удалить чужое сообщение)
    404 Not Found

9. POST api/Chat/feedback
Описание: отправить рейтинг/комментарий для конкретного сообщения. Фидбек сохраняется как запись в LlmLogs для аналитики.
Заголовки:
  Authorization: Bearer <JWT_TOKEN>
Тело запроса:

{
  "messageId": "<GUID>",
  "rating": 4,
  "comment": "Полезный ответ"
}

Возврат:
    Успех:
    200 OK

{ "message": "Feedback saved" }

Ошибки:
    401 Unauthorized

10. Замечания для фронтенда
- Базовый URL: `http://localhost:8080` (или значение окружения).
- Сначала вызвать `POST /api/Auth/login` (или `register`), получить JWT и записать в хранилище.
- При каждом защищённом запросе добавлять заголовок `Authorization: Bearer <JWT>`.
- `sessionId` в ответах — строка, используйте её при следующих вызовах `/message` и `/messages`.
- Для идемпотентных операций (создание сессии, отправка сообщения, создание шаблона) можно передавать заголовок `Idempotency-Key`.
- Контракты ошибок: все ошибки возвращают JSON с полем `message` и опционально `errors`.

11. ADMIN — AdminController (только для ролей Admin)

11.1 GET api/Admin/llmlogs
Описание: получить список LLM‑логов с фильтрами и превью полей.
Заголовки:
  Authorization: Bearer <JWT_TOKEN> (пользователь с ролью `Admin`)
Параметры query:
  `userId` (GUID) — опционально, фильтр по пользователю
  `from` (datetime) — опционально, начало диапазона
  `to` (datetime) — опционально, конец диапазона
  `limit` (int) — максимум записей, по умолчанию 100 (макс 1000)
Возврат:
    Успех:
    200 OK

[
  {
    "id": "<GUID>",
    "userId": "<GUID>",
    "requestPreview": "первые 200 символов запроса...",
    "responsePreview": "первые 200 символов ответа...",
    "modelUsed": null,
    "createdAt": "2025-11-13T13:10:05Z"
  }
]

Ошибки:
    401 Unauthorized (если не авторизован)
    403 Forbidden (если пользователь не Admin)

11.2 DELETE api/Admin/llmlogs/olderThan?days=30
Описание: удалить LLM‑логи старше заданного количества дней.
Заголовки:
  Authorization: Bearer <JWT_TOKEN> (требуется роль Admin)
Параметры query:
  `days` (int) — количество дней, по умолчанию 30
Возврат:
    Успех:
    204 No Content
    Ошибки:
    401 Unauthorized
    403 Forbidden
    500 Internal Server Error (если не удалось удалить)

12. Templates — TemplatesController

12.1 GET api/Templates
Описание: получить все шаблоны (публичный доступ в коде — без Authorize атрибута).
Возврат:
    Успех:
    200 OK

[ { /* Template objects */ } ]


12.2 GET api/Templates/{id}
Описание: получить шаблон по GUID.
Параметры пути: `id` (GUID)
Возврат:
    200 OK — объект Template
    404 Not Found — если не найден

12.3 POST api/Templates
Описание: создать новый шаблон (требуется авторизация).
Заголовки:
  Authorization: Bearer <JWT_TOKEN>
  Опционально: `Idempotency-Key` — для идемпотентности
Тело запроса: объект Template (см. поля ниже)
Возврат:
    Успех:
    201 Created — возвращает созданный шаблон
    Ошибки:
    401 Unauthorized
    500 Internal Server Error

Примечание:
- При использовании `Idempotency-Key` сервер сохраняет ответ (TTL 7 дней). При ошибке — сохраняется краткий ответ с TTL 1 день.

12.4 PUT api/Templates/{id}
Описание: обновить шаблон (требуется авторизация).
Параметры пути: `id` (GUID)
Тело запроса: объект Template (обновлённые поля)
Возврат:
    200 OK — возвращает обновлённый шаблон
    404 Not Found

12.5 DELETE api/Templates/{id}
Описание: удалить шаблон (требуется авторизация).
Параметры пути: `id` (GUID)
Возврат:
    204 No Content
    404 Not Found

13. User — UserController

13.1 GET api/User/profile
Описание: получить профиль текущего пользователя.
Заголовки:
  Authorization: Bearer <JWT_TOKEN>
Возврат:
    200 OK

{
  "id": "<GUID>",
  "email": "test@example.com",
  "fullName": "Иван Иванов",
  "role": "User",
  "createdAt": "2025-01-01T12:00:00Z",
  "lastLogin": "2025-11-13T12:00:00Z"
}

Ошибки:
    401 Unauthorized
    404 Not Found (если пользователь не найден — редкий кейс)

13.2 PUT api/User/profile
Описание: обновить профиль (в текущей реализации можно менять `FullName`).
Заголовки:
  Authorization: Bearer <JWT_TOKEN>
Тело запроса:

{
  "fullName": "Иван Петров"
}

Возврат:
    200 OK

{ "message": "Profile updated" }

Ошибки:
    401 Unauthorized
    404 Not Found

14. Health — HealthController

14.1 GET api/Health
Описание: базовый health‑check приложения.
Возврат:
    200 OK

{ "status": "healthy", "time": "2025-11-13T13:20:00Z" }


15. Общие контракты ошибок и примечания
- Формат ошибок:

{ "message": "Описание ошибки", "errors": ["...optional..."] }

- 401 Unauthorized — неверный или отсутствующий токен.
- 403 Forbidden — недостаточно прав (например, обычный пользователь к Admin endpoints).
- 404 Not Found — ресурс не найден.
- 500 Internal Server Error — внутренняя ошибка сервера; сообщение без стектрейса.

16. Структура основных сущностей (кратко)
- ChatSession:
  - id: GUID (в БД)
  - sessionId: string (публичный идентификатор сессии)
  - userId: GUID
  - title, businessType, selectedCategory, startedAt, lastActivity
- ChatMessage:
  - id: GUID
  - sessionId: GUID (FK на ChatSession.Id)
  - userId: GUID
  - content: string
  - timestamp: datetime
  - isFromUser: bool
  - category: string
- LlmLog:
  - id, userId, requestText, responseText, modelUsed, tokensInput, tokensOutput, createdAt
- Template:
  - id: GUID, name, description, promptTemplate, domainId, createdAt
- User:
  - id: GUID, email, fullName, role, createdAt, lastLogin

17. Быстрые примеры curl
- Login:
bash
curl -X POST "{{baseUrl}}/api/Auth/login" -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"demo123"}'

- Send message:
bash
curl -X POST "{{baseUrl}}/api/Chat/message" -H "Content-Type: application/json" -H "Authorization: Bearer {{token}}" -d '{"content":"Привет","category":"Общее"}'
