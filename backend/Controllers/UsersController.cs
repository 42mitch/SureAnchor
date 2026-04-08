using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public UsersController(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    // ── PATCH /api/users/me/display-name ─────────────────────────────────────
    // Any authenticated staff/admin user can update their own display name.
    [HttpPatch("me/display-name")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> UpdateMyDisplayName([FromBody] UpdateDisplayNameDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.DisplayName))
            return BadRequest(new { message = "Display name cannot be empty." });

        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        user.DisplayName = dto.DisplayName.Trim();
        await _userManager.UpdateAsync(user);
        return NoContent();
    }

    // ── POST /api/users/me/change-password ────────────────────────────────────
    // Any authenticated staff/admin user can change their own password,
    // provided they supply their current password correctly.
    [HttpPost("me/change-password")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> ChangeMyPassword([FromBody] ChangePasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NewPassword))
            return BadRequest(new { message = "New password is required." });

        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded)
        {
            var errs = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(new { message = errs.First(), errors = errs });
        }
        return NoContent();
    }

    // ── GET /api/users ────────────────────────────────────────────────────────
    // Returns all Admin and Staff accounts only (not Donors).
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var adminUsers  = await _userManager.GetUsersInRoleAsync("Admin");
        var staffUsers  = await _userManager.GetUsersInRoleAsync("Staff");

        var allUsers = adminUsers.Union(staffUsers, UserIdComparer.Instance).ToList();

        var dtos = new List<StaffUserDto>();
        foreach (var u in allUsers.OrderBy(u => u.Email))
        {
            var roles = await _userManager.GetRolesAsync(u);
            dtos.Add(new StaffUserDto(
                u.Id,
                u.Email ?? string.Empty,
                u.DisplayName,
                roles.ToList(),
                u.LockoutEnd.HasValue && u.LockoutEnd > DateTimeOffset.UtcNow
            ));
        }
        return Ok(dtos);
    }

    // ── POST /api/users ───────────────────────────────────────────────────────
    // Creates a new Admin or Staff account.
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] StaffUserWriteDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { message = "Email and password are required." });

        if (dto.Role != "Admin" && dto.Role != "Staff")
            return BadRequest(new { message = "Role must be Admin or Staff." });

        var existing = await _userManager.FindByEmailAsync(dto.Email);
        if (existing != null)
            return Conflict(new { message = "An account with that email already exists." });

        var user = new ApplicationUser
        {
            UserName       = dto.Email,
            Email          = dto.Email,
            DisplayName    = string.IsNullOrWhiteSpace(dto.DisplayName) ? dto.Email : dto.DisplayName.Trim(),
            EmailConfirmed = true,
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            var errs = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(new { message = errs.First(), errors = errs });
        }

        if (!await _roleManager.RoleExistsAsync(dto.Role))
            await _roleManager.CreateAsync(new IdentityRole(dto.Role));

        await _userManager.AddToRoleAsync(user, dto.Role);

        return Ok(new { userId = user.Id });
    }

    // ── PUT /api/users/{id} ───────────────────────────────────────────────────
    // Updates display name and/or role of an existing staff account.
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] StaffUserUpdateDto dto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        if (dto.Role != "Admin" && dto.Role != "Staff")
            return BadRequest(new { message = "Role must be Admin or Staff." });

        // Update display name
        if (!string.IsNullOrWhiteSpace(dto.DisplayName))
            user.DisplayName = dto.DisplayName.Trim();

        await _userManager.UpdateAsync(user);

        // Update role if changed
        var currentRoles = await _userManager.GetRolesAsync(user);
        var staffRoles = currentRoles.Where(r => r == "Admin" || r == "Staff").ToList();

        if (!staffRoles.Contains(dto.Role))
        {
            await _userManager.RemoveFromRolesAsync(user, staffRoles);

            if (!await _roleManager.RoleExistsAsync(dto.Role))
                await _roleManager.CreateAsync(new IdentityRole(dto.Role));

            await _userManager.AddToRoleAsync(user, dto.Role);
        }

        return NoContent();
    }

    // ── POST /api/users/{id}/reset-password ───────────────────────────────────
    // Resets the password for a staff account.
    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(string id, [FromBody] ResetPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NewPassword))
            return BadRequest(new { message = "New password is required." });

        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        var token  = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, dto.NewPassword);

        if (!result.Succeeded)
        {
            var errs = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(new { message = errs.First(), errors = errs });
        }

        return NoContent();
    }

    // ── DELETE /api/users/{id} ────────────────────────────────────────────────
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        // Prevent self-deletion
        var currentUser = await _userManager.GetUserAsync(User);
        if (currentUser?.Id == id)
            return BadRequest(new { message = "You cannot delete your own account." });

        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        await _userManager.DeleteAsync(user);
        return NoContent();
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Deduplicates users when a user has both Admin and Staff roles (edge case)
class UserIdComparer : IEqualityComparer<ApplicationUser>
{
    public static readonly UserIdComparer Instance = new();
    public bool Equals(ApplicationUser? x, ApplicationUser? y) => x?.Id == y?.Id;
    public int GetHashCode(ApplicationUser obj) => obj.Id.GetHashCode();
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record StaffUserDto(
    string UserId,
    string Email,
    string? DisplayName,
    List<string> Roles,
    bool IsLockedOut
);

public record StaffUserWriteDto(
    string Email,
    string Password,
    string? DisplayName,
    string Role
);

public record StaffUserUpdateDto(
    string? DisplayName,
    string Role
);

public record ResetPasswordDto(string NewPassword);
public record UpdateDisplayNameDto(string DisplayName);
public record ChangePasswordDto(string CurrentPassword, string NewPassword);