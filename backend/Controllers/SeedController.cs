using Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

/// <summary>
/// One-time database seeder for roles and initial users.
/// This endpoint is only usable when NO users exist yet (safe to leave deployed).
/// Call POST /api/seed once after running migrations, then you're done.
/// </summary>
[ApiController]
[Route("api/seed")]
public class SeedController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public SeedController(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    [HttpPost]
    public async Task<IActionResult> Seed()
    {
        // Safety check — only runs if no users exist yet
        if (_userManager.Users.Any())
            return Conflict(new { message = "Database already has users. Seed aborted." });

        var errors = new List<string>();

        // ── 1. Create roles ────────────────────────────────────────────────────
        foreach (var role in new[] { "Admin", "Staff", "Donor" })
        {
            if (!await _roleManager.RoleExistsAsync(role))
            {
                var result = await _roleManager.CreateAsync(new IdentityRole(role));
                if (!result.Succeeded)
                    errors.AddRange(result.Errors.Select(e => $"Role {role}: {e.Description}"));
            }
        }

        // ── 2. Seed users ──────────────────────────────────────────────────────
        var users = new[]
        {
            new { Email = "admin@sureanchor.org",  Password = "SureAnchorAdmin2025", DisplayName = "System Admin",  Role = "Admin"  },
            new { Email = "staff@sureanchor.org",  Password = "SureAnchorStaff2025", DisplayName = "Staff Member",  Role = "Staff"  },
            new { Email = "donor@sureanchor.org",  Password = "SureAnchorDonor2025", DisplayName = "Sample Donor",  Role = "Donor"  },
        };

        foreach (var u in users)
        {
            var appUser = new ApplicationUser
            {
                UserName    = u.Email,
                Email       = u.Email,
                DisplayName = u.DisplayName,
                EmailConfirmed = true,
            };

            var createResult = await _userManager.CreateAsync(appUser, u.Password);
            if (createResult.Succeeded)
            {
                await _userManager.AddToRoleAsync(appUser, u.Role);
            }
            else
            {
                errors.AddRange(createResult.Errors.Select(e => $"User {u.Email}: {e.Description}"));
            }
        }

        if (errors.Any())
            return BadRequest(new { message = "Seed completed with errors.", errors });

        return Ok(new
        {
            message = "Seed successful! Created 3 roles and 3 users.",
            users = users.Select(u => new { u.Email, u.Password, u.Role })
        });
    }
}
