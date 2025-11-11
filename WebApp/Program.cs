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
        var builder = WebApplication.CreateBuilder(args);

        var secretsDirectory = Path.Combine(Directory.GetCurrentDirectory(), "Secrets");
        builder.Configuration.AddJsonFile(
            Path.Combine(secretsDirectory, "appsettings.json"),
            optional: false,
            reloadOnChange: true);

        // Add services to the container.
        builder.Services.AddControllers();

        // JWT Configuration
        var jwtSecretKey = builder.Configuration["Jwt:SecretKey"]!;
        var jwtTokenExpirationHours = int.Parse(builder.Configuration["Jwt:TokenExpirationHours"]!);

        builder.Services.AddSingleton<IAuthService, AuthService>();
        builder.Services.AddScoped<IAiService, MockAiService>();

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

        // Configure Swagger - только один вызов AddSwaggerGen!
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Alpha Business Assistant API",
                Version = "v1",
                Description = "API для ассистента малого бизнеса с поддержкой JWT аутентификации"
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

        // Configure the HTTP request pipeline.
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

        // Authentication & Authorization middleware
        app.UseAuthentication();
        app.UseAuthorization();

        app.MapControllers();

        app.Run();
    }
}