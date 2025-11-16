using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace WebApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SecurityController : ControllerBase
{
    [HttpPost("validate-token")]
    [Authorize]
    public IActionResult ValidateToken()
    {
        return Ok(new { valid = true, user = User.Identity?.Name });
    }

    [HttpPost("csrf-token")]
    public IActionResult GetCsrfToken()
    {
        return Ok(new { token = Guid.NewGuid().ToString() });
    }
}