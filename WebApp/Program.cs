using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using WebApp.Interfaces;
using WebApp.Services;

internal partial class Program
{
    private static void Main(string[] args)
    {
        System.Net.ServicePointManager.SecurityProtocol = System.Net.SecurityProtocolType.Tls12 | System.Net.SecurityProtocolType.Tls13;

        var builder = WebApplication.CreateBuilder(args);

        // Загружаем конфигурацию из папки Secrets
        var secretsDirectory = Path.Combine(Directory.GetCurrentDirectory(), "Secrets");
        builder.Configuration.AddJsonFile(
            Path.Combine(secretsDirectory, "appsettings.json"),
            optional: false,
            reloadOnChange: true);

        // Добавляем сервисы
        builder.Services.AddControllers();

        // Конфигурация JWT
        var jwtSecretKey = builder.Configuration["Jwt:SecretKey"]!;
        var jwtTokenExpirationHours = int.Parse(builder.Configuration["Jwt:TokenExpirationHours"]!);

        builder.Services.AddSingleton<IAuthService, AuthService>();
        builder.Services.AddHttpClient();
        builder.Services.AddScoped<IAiService, OpenRouterService>();

        // Настройка аутентификации
        builder.Services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSecretKey)),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

        builder.Services.AddAuthorization();
        builder.Services.AddEndpointsApiExplorer();

        // Настройка Swagger с поддержкой авторизации
        builder.Services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Alpha Business Assistant API",
                Version = "v1",
                Description = "API для ассистента малого бизнеса с поддержкой JWT аутентификации"
            });

            // Добавляем поддержку JWT в Swagger
            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http,
                Scheme = "Bearer"
            });

            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        var app = builder.Build();

        // Конфигурация HTTP запросов
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "Alpha Business Assistant API V1");
                c.RoutePrefix = string.Empty; // Swagger будет доступен на корневом пути
            });
        }

        app.UseHttpsRedirection();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();
        app.Run();
    }
}