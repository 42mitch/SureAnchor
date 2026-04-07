using Microsoft.AspNetCore.Identity;

namespace Backend.Models;

public class ApplicationUser : IdentityUser
{
    public int? SupporterId { get; set; }
    public string? DisplayName { get; set; }

    public Supporter? Supporter { get; set; }
}
