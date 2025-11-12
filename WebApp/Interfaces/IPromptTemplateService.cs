namespace WebApp.Interfaces
{
    public interface IPromptTemplateService
    {
        string GeneratePrompt(string userInput, string category);
    }
}