using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;

    public AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
    }

    // ── POST /api/auth/login ──────────────────────────────────────────────────
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null)
            return Unauthorized(new { message = "Invalid email or password." });

        var result = await _signInManager.PasswordSignInAsync(
            user, req.Password, isPersistent: false, lockoutOnFailure: true);

        if (result.IsLockedOut)
            return StatusCode(429, new { message = "Account locked out. Try again later." });

        if (!result.Succeeded)
            return Unauthorized(new { message = "Invalid email or password." });

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new UserResponse(user.Email!, user.DisplayName, [.. roles]));
    }

    // ── POST /api/auth/logout ─────────────────────────────────────────────────
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok(new { message = "Signed out." });
    }

    // ── GET /api/auth/me ──────────────────────────────────────────────────────
    [HttpGet("me")]
    [AllowAnonymous]
    public async Task<IActionResult> Me()
    {
        if (User.Identity?.IsAuthenticated != true)
            return Unauthorized(new { message = "Not authenticated." });

        var user = await _userManager.GetUserAsync(User);
        if (user == null)
            return Unauthorized(new { message = "User not found." });

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new UserResponse(user.Email!, user.DisplayName, [.. roles]));
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record LoginRequest(string Email, string Password);
public record UserResponse(string Email, string? DisplayName, List<string> Roles);
