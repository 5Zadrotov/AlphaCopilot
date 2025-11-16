using WebApp.Data;
using WebApp.Interfaces;
using WebApp.Models.DbModels;

namespace WebApp.Services
{
    public class LlmLogService(ApplicationDbContext db, ILogger<LlmLogService> logger) : ILlmLogService
    {
        private readonly ApplicationDbContext _db = db;
        private readonly ILogger<LlmLogService> _logger = logger;

        public async Task CreateLogAsync(LlmLog log)
        {
            if (log == null)
            {
                _logger.LogWarning("Attempt to create null LlmLog.");
                return;
            }

            try
            {
                log.Id = log.Id == Guid.Empty ? Guid.NewGuid() : log.Id;
                log.CreatedAt = log.CreatedAt == default ? DateTime.UtcNow : log.CreatedAt;

                if (!string.IsNullOrEmpty(log.RequestText) && log.RequestText.Length > 5000)
                    log.RequestText = log.RequestText.Substring(0, 5000) + "...";

                if (!string.IsNullOrEmpty(log.ResponseText) && log.ResponseText.Length > 10000)
                    log.ResponseText = log.ResponseText.Substring(0, 10000) + "...";

                await _db.LlmLogs.AddAsync(log);
                await _db.SaveChangesAsync();

                _logger.LogInformation("LLM log created: Id={LogId}, userId={UserId}, requestLen={ReqLen}, responseLen={ResLen}",
                    log.Id, log.UserId, log.RequestText?.Length ?? 0, log.ResponseText?.Length ?? 0);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save LLM log for user {UserId}.", log.UserId);
            }
        }
    }
}