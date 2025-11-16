using System;

namespace WebApp.Interfaces
{
    public interface IAiService
    {
        Task<string> GetResponseAsync(string userInput, string category, Guid userId);
    }
}