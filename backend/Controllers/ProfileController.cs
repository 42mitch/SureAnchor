using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize] // Any authenticated user — Admin, Staff, or Donor
public class ProfileController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public ProfileController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    // ── GET /api/profile ──────────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        string? country = null;
        if (user.SupporterId != null)
        {
            var db = HttpContext.RequestServices.GetRequiredService<Backend.Data.ApplicationDbContext>();
            var supporter = await db.Supporters.FindAsync(user.SupporterId);
            country = supporter?.Country;
        }

        return Ok(new { country });
    }

    // ── PATCH /api/profile/display-name ───────────────────────────────────────
    [HttpPatch("display-name")]
    public async Task<IActionResult> UpdateDisplayName([FromBody] ProfileDisplayNameDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.DisplayName))
            return BadRequest(new { message = "Display name cannot be empty." });

        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        user.DisplayName = dto.DisplayName.Trim();
        await _userManager.UpdateAsync(user);
        return NoContent();
    }

    // ── PATCH /api/profile/country ────────────────────────────────────────────
    [HttpPatch("country")]
    public async Task<IActionResult> UpdateCountry([FromBody] ProfileCountryDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        if (user.SupporterId == null) return BadRequest(new { message = "No supporter record found." });

        var db = HttpContext.RequestServices.GetRequiredService<Backend.Data.ApplicationDbContext>();
        var supporter = await db.Supporters.FindAsync(user.SupporterId);
        if (supporter == null) return NotFound();

        supporter.Country = string.IsNullOrWhiteSpace(dto.Country) ? null : dto.Country.Trim();
        await db.SaveChangesAsync();
        return NoContent();
    }
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ProfileChangePasswordDto dto)
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
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record ProfileDisplayNameDto(string DisplayName);
public record ProfileChangePasswordDto(string CurrentPassword, string NewPassword);
public record ProfileCountryDto(string? Country);