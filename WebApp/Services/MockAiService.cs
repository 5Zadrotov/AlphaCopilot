using WebApp.Interfaces;

namespace WebApp.Services
{
    public class MockAiService : IAiService
    {
        private readonly Dictionary<string, Dictionary<string, List<string>>> _mockResponses = new()
    {
        {
            "Общее", new Dictionary<string, List<string>>
            {
                { "привет", new List<string> { "Здравствуйте! Чем я могу вам помочь сегодня?" } },
                { "помощь", new List<string> { "Я могу помочь вам с юридическими вопросами, финансами, маркетингом и другими аспектами вашего бизнеса." } },
                { "default", new List<string> { "Спасибо за ваш вопрос. Я изучаю запрос и скоро предоставлю вам полезную информацию." } }
            }
        },
        {
            "Юридическое", new Dictionary<string, List<string>>
            {
                { "договор", new List<string> { "Для создания договора с поставщиком вам понадобятся следующие разделы: предмет договора, сроки поставки, условия оплаты, ответственность сторон, форс-мажорные обстоятельства." } },
                { "default", new List<string> { "Это юридический вопрос. В реальном приложении я бы проанализировал ваш запрос и предоставил соответствующие рекомендации с учетом законодательства РФ." } }
            }
        },
        {
            "Финансы", new Dictionary<string, List<string>>
            {
                { "налоги", new List<string> { "В зависимости от вашей системы налогообложения (УСН, ЕНВД, ОСНО), вам необходимо сдавать соответствующую отчетность." } },
                { "default", new List<string> { "Это финансовый вопрос. В реальном приложении я бы проанализировал вашу ситуацию и предоставил рекомендации по оптимизации налогообложения." } }
            }
        },
        {
            "Маркетинг", new Dictionary<string, List<string>>
            {
                { "акция", new List<string> { "Можно предложить акцию \"Купи 5 - 6-е в подарок\" или вечерние скидки после 18:00 для привлечения клиентов в off-peak часы." } },
                { "соцсети", new List<string> { "Рекомендуется публиковать качественные фото продукции, делиться историями о бизнесе, проводить конкурсы и рассказывать о ваших поставщиках." } },
                { "default", new List<string> { "Это вопрос по маркетингу. В реальном приложении я бы предложил конкретные стратегии продвижения для вашего бизнеса." } }
            }
        }
    };

        public async Task<string> GetResponseAsync(string userInput, string category)
        {
            if (string.IsNullOrEmpty(category) || category == "Общее")
            {
                if (userInput.Contains("договор", StringComparison.CurrentCultureIgnoreCase) || userInput.Contains("юридич", StringComparison.CurrentCultureIgnoreCase))
                    category = "Юридическое";
                else if (userInput.Contains("налог", StringComparison.CurrentCultureIgnoreCase) || userInput.Contains("финанс", StringComparison.CurrentCultureIgnoreCase) || userInput.Contains("деньги", StringComparison.CurrentCultureIgnoreCase))
                    category = "Финансы";
                else if (userInput.Contains("акция", StringComparison.CurrentCultureIgnoreCase) || userInput.Contains("маркетинг", StringComparison.CurrentCultureIgnoreCase) || userInput.Contains("реклама", StringComparison.CurrentCultureIgnoreCase) || userInput.Contains("соцсет", StringComparison.CurrentCultureIgnoreCase))
                    category = "Маркетинг";
            }

            //ответ
            if (_mockResponses.TryGetValue(category, out var categoryResponses))
            {
                var normalizedInput = userInput.ToLower();

                foreach (var (keyword, responses) in categoryResponses)
                {
                    if (keyword == "default") continue;
                    if (normalizedInput.Contains(keyword))
                    {
                        return responses[0];
                    }
                }
                if (categoryResponses.TryGetValue("default", out var defaultResponses))
                {
                    return defaultResponses[0];
                }
            }

            return "Я получил ваш вопрос и работаю над ответом. В реальном приложении здесь был бы ответ от AI-ассистента с рекомендациями.";
        }
    }
}
