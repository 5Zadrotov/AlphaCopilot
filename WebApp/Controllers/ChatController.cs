using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Interfaces;
using WebApp.Models.DbModels;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController(IAiService aiService) : ControllerBase
    {
        private readonly IAiService _aiService = aiService;
        private static readonly List<ChatMessage> _chatHistory = [];

        [HttpPost("message")]
        public async Task<IActionResult> SendMessage([FromBody] ChatMessageRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Content))
                return BadRequest("Сообщение не может быть пустым");

            //получаем данные из токена
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "1");

            var userMessage = new ChatMessage
            {
                Id = _chatHistory.Count + 1,
                UserId = userId,
                Content = request.Content,
                IsFromUser = true,
                Category = request.Category,
                Timestamp = DateTime.UtcNow
            };

            _chatHistory.Add(userMessage);

            try
            {
                //заглушка
                var aiResponse = await _aiService.GetResponseAsync(request.Content, request.Category);

                var aiMessage = new ChatMessage
                {
                    Id = _chatHistory.Count + 1,
                    UserId = userId,
                    Content = aiResponse,
                    IsFromUser = false,
                    Category = request.Category,
                    Timestamp = DateTime.UtcNow
                };

                _chatHistory.Add(aiMessage);

                return Ok(new
                {
                    userMessage,
                    aiMessage
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при получении ответа от AI: {ex.Message}");
            }
        }

        [HttpGet("history")]
        public IActionResult GetHistory()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "1");
            var userHistory = _chatHistory
                .Where(m => m.UserId == userId)
                .OrderBy(m => m.Timestamp)
                .ToList();

            return Ok(userHistory);
        }
    }
}