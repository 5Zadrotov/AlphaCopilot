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
  Authorization: Bearer <JWT_TOKEN>

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
	{
	    "sessions": [
		  {
		    "sessionId": "<string GUID>",
		    "businessType": "Малый бизнес",
		    "selectedCategory": "Общее",
		    "startedAt": "2025-11-13T12:34:56Z",
		    "lastActivity": "2025-11-13T13:00:00Z",
		    "title": "Сессия для Малый бизнес",
		    "id": "<GUID>" // внутренний GUID записи
		  },
		  ...
		]
	}
	Неудача:
	401 Unauthorized
	500 Internal Server Error

5. POST api/Chat/message
Описание: отправить сообщение в сессию (или создать новую) и получить ответ от AI.
Заголовки:
  Authorization: Bearer <JWT_TOKEN>
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
	  "userMessage": {
	    "id": "<GUID>",
	    "sessionId": "<GUID>",
	    "userId": "<GUID>",
	    "content": "Здравствуйте, подскажите, как открыть ИП?",
	    "timestamp": "2025-11-13T13:10:00Z",
	    "isFromUser": true,
	    "category": "Юридическое"
	  },
	  "aiMessage": {
	    "id": "<GUID>",
	    "sessionId": "<GUID>",
	    "userId": "<GUID>",
	    "content": "Краткий ответ от модели...",
	    "timestamp": "2025-11-13T13:10:05Z",
	    "isFromUser": false,
	    "category": "Юридическое"
	  }
	}
	Неудача:
	400 Bad Request (пустое content)
	401 Unauthorized
	500 Internal Server Error (ошибка AI или сохранения)

Примечания:
- При отправке без `sessionId` сервер создаёт новую сессию и возвращает её `sessionId`.
- Сообщения сохраняются в БД: поле `sessionId` (GUID), `userId` (GUID владельца), `content`, `timestamp`, `isFromUser`, `category`.
- После получения ответа AI создаётся LLM‑лог (в таблицу `LlmLogs`), в логе сохраняется усечённый request/response (обрезаются большие тексты).

6. GET api/Chat/history
Описание: получить историю сообщений по сессии или последнюю активную сессию.
Заголовки:
  Authorization: Bearer <JWT_TOKEN>
Параметры:
  sessionId (query) — string GUID, опционально
Примеры:
- GET /api/Chat/history?sessionId=<GUID>
Возврат:
	Успех:
	200 OK
	{
	  "sessionId": "<GUID>",
	  "messages": [
	    {
	      "id": "<GUID>",
	      "sessionId": "<GUID>",
	      "userId": "<GUID>",
	      "content": "Первое сообщение",
	      "timestamp": "2025-11-13T13:00:00Z",
	      "isFromUser": true,
	      "category": "Общее"
	    },
	    ...
	  ]
	}
- GET /api/Chat/history  (без sessionId) — возвращает последнюю активную сессию пользователя (или создаёт новую пустую).

Ошибки:
	401 Unauthorized
	404 Not Found (если указан sessionId и сессия не найдена)
	500 Internal Server Error

7. Замечания для фронтенда
- Базовый URL: http://localhost:8080 (или значение окружения)
- Сначала вызвать POST /api/Auth/login (или register), получить JWT и записать в хранилище.
- При каждом защищённом запросе добавлять заголовок Authorization: Bearer <JWT>.
- `sessionId` в ответах — строка, используйте её при следующих вызовах /message и /history.
- Для отладки используйте Swagger (если включён) или Postman; пример PowerShell/Invoke-RestMethod и curl приведён в проекте README/доках.

8. Поля сущностей (кратко)
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

9. Примеры быстрых запросов (curl)
- Login:
  curl -X POST "{{baseUrl}}/api/Auth/login" -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"demo123"}'
- Send message:
  curl -X POST "{{baseUrl}}/api/Chat/message" -H "Content-Type: application/json" -H "Authorization: Bearer {{token}}" -d '{"content":"Привет","category":"Общее"}'

10. Контракты ошибок
- Все ошибки возвращают JSON с полем `message` (и опционально `errors`):
  { "message": "Описание ошибки" }
- На серверных ошибках возвращается статус 500 и простое сообщение, без детальных стектрейсов (в продакшне).
