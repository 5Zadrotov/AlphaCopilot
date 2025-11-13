using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController(ApplicationDbContext db) : ControllerBase
    {
        private readonly ApplicationDbContext _db = db;

        // GET api/Admin/llmlogs
        [HttpGet("llmlogs")]
        public async Task<IActionResult> GetLlmLogs([FromQuery] Guid? userId = null, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null, [FromQuery] int limit = 100)
        {
            var q = _db.LlmLogs.AsNoTracking().OrderByDescending(l => l.CreatedAt).AsQueryable();
            if (userId.HasValue) q = q.Where(l => l.UserId == userId.Value);
            if (from.HasValue) q = q.Where(l => l.CreatedAt >= from.Value);
            if (to.HasValue) q = q.Where(l => l.CreatedAt <= to.Value);
            q = q.Take(Math.Clamp(limit, 1, 1000));
            var list = await q.ToListAsync();
            return Ok
            (
                list.Select(l =>
                    new
                    {
                        l.Id,
                        l.UserId,
                        RequestPreview =
                        (l.RequestText?.Length > 200 ?
                            string.Concat(l.RequestText.AsSpan(0, 200), "...")
                            : l.RequestText),
                        ResponsePreview =
                        (l.ResponseText?.Length > 200 ?
                            string.Concat(l.ResponseText.AsSpan(0, 200), "...")
                            : l.ResponseText),
                        l.ModelUsed,
                        l.CreatedAt
                    })
            );
        }

        // DELETE api/Admin/llmlogs/olderThan?days=30
        [HttpDelete("llmlogs/olderThan")]
        public async Task<IActionResult> DeleteOlderThan([FromQuery] int days = 30)
        {
            var cutoff = DateTime.UtcNow.AddDays(-days);
            var toDelete = _db.LlmLogs.Where(l => l.CreatedAt < cutoff);
            _db.LlmLogs.RemoveRange(toDelete);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}