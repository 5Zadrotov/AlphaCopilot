using WebApp.Models.DbModels;

namespace WebApp.Interfaces
{
    public interface ILlmLogService
    {
        Task CreateLogAsync(LlmLog log);
    }
}