using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using WebApp.Interfaces;
using WebApp.Models.DbModels;

namespace WebApp.Services
{
    public class OpenRouterService : IAiService
    {
        private static readonly JsonSerializerOptions _jsonSerializerOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<OpenRouterService> _logger;
        private readonly ILlmLogService _llmLogService;
        private readonly bool _enabled;
        private readonly string _apiKey;

        public OpenRouterService(IConfiguration configuration, HttpClient httpClient, ILogger<OpenRouterService> logger, ILlmLogService llmLogService)
        {
            _configuration = configuration;
            _httpClient = httpClient;
            _logger = logger;
            _llmLogService = llmLogService;

            var apiKey = _configuration["OpenRouter:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning("OpenRouter API key is not configured. AI calls will be disabled (fallback).");
                _enabled = false;
                _apiKey = string.Empty;
            }
            else
            {
                _apiKey = apiKey;
                _enabled = true;
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                _httpClient.DefaultRequestHeaders.Add("HTTP-Referer", "http://localhost:5000");
                _httpClient.DefaultRequestHeaders.Add("X-Title", "AlphaCopilot");
            }
        }

        public async Task<string> GetResponseAsync(string userInput, string category, Guid userId)
        {
            if (string.IsNullOrWhiteSpace(userInput))
            {
                _logger.LogInformation("GetResponseAsync called with empty userInput (userId={UserId}).", userId);
                return "Пустой запрос.";
            }

            if (!_enabled)
            {
                _logger.LogWarning("AI service disabled — returning fallback answer (userId={UserId}).", userId);
                await _llmLogService.CreateLogAsync(new LlmLog
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    RequestText = Truncate(userInput, 2000),
                    ResponseText = "AI service disabled - fallback response",
                    ModelUsed = null,
                    TokensInput = 0,
                    TokensOutput = 0
                });
                return "AI временно недоступен. Попробуйте позже.";
            }

            var prompt = BuildPrompt(userInput, category);
            const int maxAttempts = 3;

            for (int attempt = 1; attempt <= maxAttempts; attempt++)
            {
                _logger.LogInformation("AI request attempt {Attempt}/{MaxAttempts} (userId={UserId}, category={Category}, promptLength={Len})",
                    attempt, maxAttempts, userId, category ?? "null", prompt?.Length ?? 0);

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

                    var json = JsonSerializer.Serialize(request, _jsonSerializerOptions);
                    using var content = new StringContent(json, Encoding.UTF8, "application/json");

                    var response = await _httpClient.PostAsync("api/v1/chat/completions", content);

                    if (!response.IsSuccessStatusCode)
                    {
                        var status = (int)response.StatusCode;
                        var body = await response.Content.ReadAsStringAsync();
                        _logger.LogWarning("OpenRouter returned non-success status {Status} (userId={UserId}). Response preview: {Preview}",
                            status, userId, Truncate(body, 500));
                        response.EnsureSuccessStatusCode();
                    }

                    var responseJson = await response.Content.ReadAsStringAsync();
                    _logger.LogDebug("OpenRouter raw response preview (userId={UserId}): {Preview}", userId, Truncate(responseJson, 500));

                    var openRouterResponse = JsonSerializer.Deserialize<OpenRouterResponse>(responseJson, _jsonSerializerOptions);

                    var aiText = openRouterResponse?.Choices?.Length > 0 ? openRouterResponse.Choices[0].Message.Content : null;

                    if (!string.IsNullOrEmpty(aiText))
                    {
                        _logger.LogInformation("AI returned answer (userId={UserId}, responseLength={Len}).", userId, aiText.Length);

                        await _llmLogService.CreateLogAsync(new LlmLog
                        {
                            Id = Guid.NewGuid(),
                            UserId = userId,
                            RequestText = Truncate(userInput, 2000),
                            ResponseText = Truncate(aiText, 4000),
                            ModelUsed = request.Model,
                            TokensInput = 0,
                            TokensOutput = 0
                        });

                        return aiText;
                    }

                    _logger.LogWarning("AI returned empty or malformed response (userId={UserId}).", userId);
                    return "Извините, я не смог сформировать ответ на ваш вопрос.";
                }
                catch (HttpRequestException hre) when (attempt < maxAttempts)
                {
                    _logger.LogWarning(hre, "HttpRequestException on attempt {Attempt}/{MaxAttempts} for userId={UserId}. Retrying...", attempt, maxAttempts, userId);
                    await Task.Delay(1000 * attempt);
                    continue;
                }
                catch (Exception e)
                {
                    _logger.LogError(e, "Critical error in OpenRouterService for userId={UserId}: {Message}", userId, e.Message);

                    try
                    {
                        await _llmLogService.CreateLogAsync(new LlmLog
                        {
                            Id = Guid.NewGuid(),
                            UserId = userId,
                            RequestText = Truncate(userInput, 2000),
                            ResponseText = Truncate($"ERROR: {e.Message}", 2000),
                            ModelUsed = null,
                            TokensInput = 0,
                            TokensOutput = 0
                        });
                    }
                    catch (Exception exLog)
                    {
                        _logger.LogWarning(exLog, "Failed to persist LLM log after error.");
                    }

                    return $"Извините, возникла ошибка при обращении к AI: {e.Message}";
                }
            }

            _logger.LogError("Repeated failures when calling AI for userId={UserId}.", userId);
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

        private static string Truncate(string? value, int maxLength)
        {
            if (string.IsNullOrEmpty(value)) return string.Empty;
            return value.Length <= maxLength ? value : string.Concat(value.AsSpan(0, maxLength), "...");
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