using System;
using System.Net.Http;
using System.Net.Http.Headers;
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

        public OpenRouterService(IConfiguration configuration, HttpClient httpClient)
        {
            _configuration = configuration;
            _httpClient = httpClient;

            var apiKey = _configuration["OpenRouter:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
                throw new Exception("OpenRouter API key не настроен в appsettings.json");

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            _httpClient.DefaultRequestHeaders.Add("HTTP-Referer", "http://localhost:5000");
            _httpClient.DefaultRequestHeaders.Add("X-Title", "AlphaCopilot");
        }

        public async Task<string> GetResponseAsync(string userInput, string category, Guid userId)
        {
            var prompt = BuildPrompt(userInput, category);
            const int maxAttempts = 3;

            for (int attempt = 1; attempt <= maxAttempts; attempt++)
            {
                try
                {
                    var request = new OpenRouterRequest
                    {
                        Model = "gryphe/mythomist-7b",
                        Messages =
                        [
                            new Message { Role = "user", Content = prompt }
                        ],
                        Temperature = 0.7f,
                        MaxTokens = 1000
                    };

                    var json = JsonSerializer.Serialize(request, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                    var content = new StringContent(json, Encoding.UTF8, "application/json");

                    var response = await _httpClient.PostAsync("https://openrouter.ai/api/v1/chat/completions", content);

                    response.EnsureSuccessStatusCode();

                    var responseJson = await response.Content.ReadAsStringAsync();
                    var openRouterResponse = JsonSerializer.Deserialize<OpenRouterResponse>(responseJson);

                    if (openRouterResponse?.Choices?.Length > 0 &&
                        !string.IsNullOrEmpty(openRouterResponse.Choices[0].Message.Content))
                    {
                        return openRouterResponse.Choices[0].Message.Content;
                    }

                    return "Извините, я не смог сформировать ответ на ваш вопрос.";
                }
                catch (HttpRequestException hre) when (attempt < maxAttempts)
                {
                    Console.WriteLine($"Попытка {attempt}/{maxAttempts} не удалась: {hre.Message}");
                    await Task.Delay(1000 * attempt);
                    continue;
                }
                catch (Exception e)
                {
                    Console.WriteLine($"Критическая ошибка в OpenRouterService: {e.Message}");
                    Console.WriteLine($"Stack Trace: {e.StackTrace}");
                    return $"Извините, возникла ошибка: {e.Message}";
                }
            }

            return "Извините, возникла повторяющаяся ошибка при обращении к сервису.";
        }

        private static string BuildPrompt(string userInput, string category)
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

        private class OpenRouterRequest
        {
            public string Model { get; set; }
            public Message[] Messages { get; set; }
            public float Temperature { get; set; } = 0.7f;
            public int MaxTokens { get; set; } = 1000;
        }

        private class Message
        {
            public string Role { get; set; }
            public string Content { get; set; }
        }

        private class OpenRouterResponse
        {
            public Choice[] Choices { get; set; }
        }

        private class Choice
        {
            public ResponseMessage Message { get; set; }
        }

        private class ResponseMessage
        {
            public string Content { get; set; }
            public string Role { get; set; }
        }
    }
}