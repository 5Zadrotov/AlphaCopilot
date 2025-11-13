using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WebApp.Data;
using WebApp.Models.DbModels;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TemplatesController(ApplicationDbContext db, ILogger<TemplatesController> logger) : ControllerBase
    {
        private readonly ApplicationDbContext _db = db;
        private readonly ILogger<TemplatesController> _logger = logger;

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
            template.Id = Guid.NewGuid();
            template.CreatedAt = DateTime.UtcNow;
            await _db.Templates.AddAsync(template);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = template.Id }, template);
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