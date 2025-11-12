using WebApp.Interfaces;
using WebApp.Models.DbModels;

namespace WebApp.Services
{
    public class LlmLogService(IDataService dataService) : ILlmLogService
    {
        private readonly IDataService _dataService = dataService;

        public async Task CreateLogAsync(LlmLog log)
        {
            // Реализация логирования в БД
            await Task.CompletedTask;
        }
    }
}