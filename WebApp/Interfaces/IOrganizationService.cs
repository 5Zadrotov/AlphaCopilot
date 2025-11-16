using WebApp.Dto;

namespace WebApp.Interfaces;

public interface IOrganizationService
{
    Task<IEnumerable<UserDto>> GetUsersInOrganizationAsync(Guid organizationId);
}