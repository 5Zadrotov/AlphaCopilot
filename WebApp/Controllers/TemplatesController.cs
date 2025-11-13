using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using WebApp.Data;
using WebApp.Interfaces;
using WebApp.Models.DbModels;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TemplatesController(ApplicationDbContext db, ILogger<TemplatesController> logger, IIdempotencyService idempotencyService) : ControllerBase
    {
        private readonly ApplicationDbContext _db = db;
        private readonly ILogger<TemplatesController> _logger = logger;
        private readonly IIdempotencyService _idempotencyService = idempotencyService;
        private static readonly JsonSerializerOptions _jsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

        // GET api/Templates
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var templates = await _db.Templates.AsNoTracking().ToListAsync();
            return Ok(templates);
        }

        // GET api/Templates/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var t = await _db.Templates.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (t == null) return NotFound(new { message = "Template not found" });
            return Ok(t);
        }

        // POST api/Templates (requires auth)
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] Template template)
        {
            // Idempotency: check header
            var idempotencyKey = Request.Headers.TryGetValue("Idempotency-Key", out Microsoft.Extensions.Primitives.StringValues value) ? value.FirstOrDefault() : null;

            // Determine userId for idempotency scope (if authorized)
            Guid userId = Guid.Empty;
            var userIdString = User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrWhiteSpace(userIdString) && Guid.TryParse(userIdString, out var parsed))
                userId = parsed;

            if (!string.IsNullOrWhiteSpace(idempotencyKey))
            {
                var existing = await _idempotencyService.TryGetAsync(idempotencyKey, userId);
                if (existing.Found)
                {
                    return new ContentResult
                    {
                        Content = existing.ResponseJson,
                        ContentType = "application/json",
                        StatusCode = existing.StatusCode
                    };
                }
            }

            // Create template
            template.Id = Guid.NewGuid();
            template.CreatedAt = DateTime.UtcNow;

            try
            {
                await _db.Templates.AddAsync(template);
                await _db.SaveChangesAsync();

                var createdObj = template;
                var json = JsonSerializer.Serialize(createdObj, _jsonOptions);

                // Save idempotency record if key provided (TTL 7 days)
                if (!string.IsNullOrWhiteSpace(idempotencyKey))
                {
                    await _idempotencyService.SaveAsync(idempotencyKey, userId, "POST", HttpContext.Request.Path, 201, json, TimeSpan.FromDays(7));
                }

                return CreatedAtAction(nameof(Get), new { id = template.Id }, template);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create template.");
                var err = new { message = "Не удалось создать шаблон" };
                var errJson = JsonSerializer.Serialize(err, _jsonOptions);

                if (!string.IsNullOrWhiteSpace(idempotencyKey))
                {
                    // save error response briefly
                    await _idempotencyService.SaveAsync(idempotencyKey, userId, "POST", HttpContext.Request.Path, 500, errJson, TimeSpan.FromDays(1));
                }

                return StatusCode(500, err);
            }
        }

        // PUT api/Templates/{id}
        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<IActionResult> Update(Guid id, [FromBody] Template updated)
        {
            var t = await _db.Templates.FirstOrDefaultAsync(x => x.Id == id);
            if (t == null) return NotFound(new { message = "Template not found" });

            t.Name = updated.Name;
            t.Description = updated.Description;
            t.PromptTemplate = updated.PromptTemplate;
            t.DomainId = updated.DomainId;
            await _db.SaveChangesAsync();

            return Ok(t);
        }

        // DELETE api/Templates/{id}
        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<IActionResult> Delete(Guid id)
        {
            var t = await _db.Templates.FirstOrDefaultAsync(x => x.Id == id);
            if (t == null) return NotFound(new { message = "Template not found" });

            _db.Templates.Remove(t);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}