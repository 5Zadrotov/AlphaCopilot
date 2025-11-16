using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Dto;
using WebApp.Interfaces;

namespace WebApp.Services;

public class OrganizationService(ApplicationDbContext context) : IOrganizationService
{
    private readonly ApplicationDbContext _context=context;

    public async Task<IEnumerable<UserDto>> GetUsersInOrganizationAsync(Guid organizationId)
    {
        var users = await _context.Users
            .Where(u => u.OrganizationId == organizationId)
            .Select(u => new UserDto // Маппим вручную, чтобы не ставить AutoMapper для одного кейса
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                Role = u.Role
            }).ToListAsync();

        return users;
    }
}