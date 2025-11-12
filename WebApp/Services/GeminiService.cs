using Google.GenAI;
using WebApp.Interfaces;

namespace WebApp.Services
{
    public class GeminiService : IAiService
    {
        private readonly Client _client;
        private readonly IConfiguration _configuration;

        public GeminiService(IConfiguration configuration)
        {
            _configuration = configuration;

            // Получаем API ключ из appsettings.json
            var apiKey = _configuration["Gemini:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
                throw new Exception("Gemini API key не настроен в appsettings.json");

            // Создаем клиента с API ключом (для версии 0.4.0)
            _client = new Client(apiKey: apiKey);
        }

        public async Task<string> GetResponseAsync(string userInput, string category, Guid userId)
        {
            try
            {
                // Создаем контекстный промпт
                var prompt = BuildPrompt(userInput, category);

                // Делаем запрос к Gemini
                var response = await _client.Models.GenerateContentAsync(
                    model: "gemini-2.5-flash",
                    contents: prompt
                );

                // Получаем текст ответа
                var result = response.Candidates[0].Content.Parts[0].Text;
                return result is not null ? result : "Извините, возникла ошибка при обработке вашего запроса: {ex.Message}. Пожалуйста, попробуйте позже.";
            }
            catch (Exception ex)
            {
                return $"Извините, возникла ошибка при обработке вашего запроса: {ex.Message}. Пожалуйста, попробуйте позже.";
            }
        }

        private string BuildPrompt(string userInput, string category)
        {
            var categoryPrompt = category switch
            {
                "Юридическое" => "Вы - юридический эксперт для малого бизнеса в России. Дайте четкий ответ с ссылками на российское законодательство.",
                "Финансы" => "Вы - финансовый эксперт для малого бизнеса в России. Предоставьте практические рекомендации по финансовым вопросам.",
                "Маркетинг" => "Вы - маркетинговый эксперт для малого бизнеса в России. Предложите конкретные стратегии продвижения.",
                _ => "Вы - экспертный бизнес-ассистент для малого бизнеса в России. Дайте практичный и конкретный совет."
            };

            return $"{categoryPrompt}\n\nВопрос пользователя: {userInput}\n\nОтвет:";
        }
    }
}