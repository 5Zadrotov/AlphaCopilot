using WebApp.Interfaces;
using WebApp.Models.DbModels;

namespace WebApp.Services
{
    public class LlmLogService(IDataService dataService) : ILlmLogService
    {
        private readonly IDataService _dataService = dataService;

        public async Task CreateLogAsync(LlmLog log)
        {
            //тут будет логика сохранения лога в базу данных
            await Task.CompletedTask;
        }
    }
}