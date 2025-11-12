using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using WebApp.Interfaces;

namespace WebApp.Services
{
    public class OpenRouterService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public OpenRouterService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<string> GetResponseAsync(string userInput, string category, Guid userId)
        {
            var apiKey = _configuration["OpenRouter:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
                throw new Exception("OpenRouter API key не настроен в appsettings.json");

            var prompt = BuildPrompt(userInput, category);

            var requestBody = new
            {
                model = _configuration["OpenRouter:Model"] ?? "meta-llama/llama-3-70b-instruct",
                messages = new[]
                {
                    new { role = "user", content = prompt }
                },
                temperature = 0.3,
                max_tokens = 2000
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions");
            request.Headers.Add("Authorization", $"Bearer {apiKey}");
            request.Headers.Add("HTTP-Referer", "https://your-app-name.com");
            request.Headers.Add("X-Title", "AlphaBusinessAssistant");
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return $"Ошибка OpenRouter API: {response.StatusCode} - {errorContent}";
                }

                var jsonResponse = await response.Content.ReadFromJsonAsync<OpenRouterResponse>();
                return jsonResponse?.choices[0]?.message?.content ??
                       "Извините, я не смог сформировать ответ на ваш вопрос.";
            }
            catch (Exception ex)
            {
                return $"Извините, возникла ошибка при обработке вашего запроса: {ex.Message}";
            }
        }

        private static string BuildPrompt(string userInput, string category)
        {
            var categoryPrompt = category switch
            {
                "Юридическое" => "Вы - юридический эксперт для малого бизнеса в России. Дайте четкий ответ с ссылками на российское законодательство. Отвечайте только по существу вопроса, без лишней информации.",
                "Финансы" => "Вы - финансовый эксперт для малого бизнеса в России. Предоставьте практические рекомендации по финансовым вопросам. Учитывайте особенности российского налогообложения.",
                "Маркетинг" => "Вы - маркетинговый эксперт для малого бизнеса в России. Предложите конкретные стратегии продвижения для малого бизнеса в российских реалиях.",
                _ => "Вы - экспертный бизнес-ассистент для малого бизнеса в России. Дайте практичный и конкретный совет. Отвечайте только по существу вопроса."
            };

            return $"{categoryPrompt}\n\nВопрос пользователя: {userInput}\n\nОтвет:";
        }

        private class OpenRouterResponse
        {
            public Choice[] choices { get; set; }
        }

        private class Choice
        {
            public Message message { get; set; }
        }

        private class Message
        {
            public string content { get; set; }
        }
    }
}