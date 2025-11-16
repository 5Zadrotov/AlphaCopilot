using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Net.Http.Headers;
using System.Text;
using WebApp.Data;
using WebApp.Interfaces;
using WebApp.Services;

namespace WebApp;

internal class Program
{
    private static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        var secretsDirectory = Path.Combine(Directory.GetCurrentDirectory(), "Secrets");
        builder.Configuration.AddJsonFile(
            Path.Combine(secretsDirectory, "appsettings.json"),
            optional: false,
            reloadOnChange: true);

        // Add services to the container.
        builder.Services.AddControllers();

        // Database Configuration
        builder.Services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

        // JWT Configuration
        var jwtSecretKey = builder.Configuration["Jwt:SecretKey"]!;
        var jwtTokenExpirationHours = int.Parse(builder.Configuration["Jwt:TokenExpirationHours"]!);

        // Register services
        builder.Services.AddSingleton<IAuthService, AuthService>();
        builder.Services.AddScoped<IDataService, DataService>();
        builder.Services.AddScoped<IPromptTemplateService, PromptTemplateService>();
        builder.Services.AddScoped<IOrganizationService, OrganizationService>(); // Регистрация нового сервиса
        builder.Services.AddScoped<ILlmLogService, LlmLogService>(); // регистрация сервиса логов
        builder.Services.AddScoped<IIdempotencyService, IdempotencyService>(); // регистрация идемпотентности
        builder.Services.AddScoped<OpenRouterService>();

        // Add authentication
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

        // Add endpoints for authorization
        builder.Services.AddAuthorization();

        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Alpha Business Assistant API",
                Version = "v1",
                Description = "API"
            });

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

        // Apply migrations on startup
        using (var scope = app.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var retries = 10;
            while (retries > 0)
            {
                try
                {
                    context.Database.EnsureCreated();
                    Console.WriteLine("Migrations applied successfully");
                    break;
                }
                catch (Exception ex)
                {
                    retries--;
                    Console.WriteLine($"Migration attempt failed: {ex.Message}. Retries left: {retries}");
                    if (retries > 0)
                        await Task.Delay(5000);
                }
            }
        }

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "Alpha Business Assistant API V1");
                c.RoutePrefix = string.Empty;
            });
        }

        // Authentication & Authorization middleware
        app.UseAuthentication();
        app.UseAuthorization();

        app.MapControllers();
        
        app.Run();
    }
}