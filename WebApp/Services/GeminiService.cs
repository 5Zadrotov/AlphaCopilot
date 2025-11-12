using Google.GenAI;
using Google.GenAI.Types;
using System;
using System.Threading.Tasks;
using WebApp.Interfaces;

namespace WebApp.Services
{
    public class GeminiService : IAiService
    {
        private readonly Client _client;
        private readonly IConfiguration _configuration;

        public GeminiService(IConfiguration configuration)
        {
            //System.Net.ServicePointManager.SecurityProtocol = System.Net.SecurityProtocolType.Tls12 | System.Net.SecurityProtocolType.Tls13;

            _configuration = configuration;

            //получаем API ключ из appsettings.json
            var apiKey = _configuration["Gemini:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
                throw new Exception("Gemini API key не настроен в appsettings.json");


            _client = new Client(apiKey: apiKey);
        }

        public async Task<string> GetResponseAsync(string userInput, string category, Guid userId)
        {
            var prompt = BuildPrompt(userInput, category);
            const int maxAttempts = 3;


            for (int attempt = 1; attempt <= maxAttempts; attempt++)
            {
                try
                {
                    //тут вылетает HttpRequestException
                    var response = await _client.Models.GenerateContentAsync(
                        model: "gemini-1.5-pro",
                        contents: prompt
                    );

                    if (response?.Candidates?.Count > 0 &&
                        response.Candidates[0]?.Content?.Parts?.Count > 0)
                    {
                        return response.Candidates[0].Content.Parts[0].Text;
                    }

                    return "Извините, я не смог сформировать ответ на ваш вопрос.";
                }
                catch (HttpRequestException hre) when (attempt < maxAttempts)
                {
                    Console.WriteLine($"Ошибка: {hre.Message}");
                    await Task.Delay(500 * attempt);
                    continue;
                }
                catch (Exception e)
                {
                    Console.WriteLine($"Ошибка: {e.Message}");
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
    }
}