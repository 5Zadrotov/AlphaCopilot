using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApp.Interfaces;

namespace WebApp.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OrganizationController : ControllerBase
{
    private readonly IOrganizationService _organizationService;

    public OrganizationController(IOrganizationService organizationService)
    {
        _organizationService = organizationService;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetOrganizationUsers()
    {
        // Получаем ID организации из клеймов JWT токена
        var orgIdClaim = User.FindFirst("OrganizationId");

        if (orgIdClaim == null || !Guid.TryParse(orgIdClaim.Value, out var organizationId))
        {
            return BadRequest("User is not part of an organization or organization ID is missing in token.");
        }

        var users = await _organizationService.GetUsersInOrganizationAsync(organizationId);

        return Ok(users);
    }
}
