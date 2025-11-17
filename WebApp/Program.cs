using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
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

        builder.Configuration.AddEnvironmentVariables();

        builder.Services.AddControllers();

        builder.Services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

        var jwtSecretKey = builder.Configuration["Jwt:SecretKey"]!;
        var jwtTokenExpirationHours = int.Parse(builder.Configuration["Jwt:TokenExpirationHours"]!);

        builder.Services.AddScoped<IAuthService, AuthService>();
        builder.Services.AddScoped<ApplicationDbContext>();
        builder.Services.AddScoped<IDataService, DataService>();
        builder.Services.AddScoped<IPromptTemplateService, PromptTemplateService>();
        builder.Services.AddScoped<IOrganizationService, OrganizationService>();
        builder.Services.AddScoped<ILlmLogService, LlmLogService>();
        builder.Services.AddScoped<IIdempotencyService, IdempotencyService>();
        builder.Services.AddScoped<IChatSessionService, ChatSessionService>();
        builder.Services.AddScoped<IAiService, OpenRouterService>();

        builder.Services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.AllowAnyOrigin()
                      .AllowAnyMethod()
                      .AllowAnyHeader();
            });
        });

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

        using (var scope = app.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var retries = 10;
            while (retries > 0)
            {
                try
                {
                    context.Database.Migrate();
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

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "Alpha Business Assistant API V1");
                c.RoutePrefix = string.Empty;
            });
        }

        app.UseCors();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();
        
        app.Run();
    }
}
