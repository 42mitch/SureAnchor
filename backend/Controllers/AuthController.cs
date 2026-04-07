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
    private readonly RoleManager<IdentityRole> _roleManager;

    public AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
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

    // ── POST /api/auth/register ───────────────────────────────────────────────
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Email and password are required." });

        var existing = await _userManager.FindByEmailAsync(req.Email);
        if (existing != null)
            return Conflict(new { message = "An account with that email already exists." });

        var user = new ApplicationUser
        {
            UserName    = req.Email,
            Email       = req.Email,
            DisplayName = req.DisplayName?.Trim().Length > 0 ? req.DisplayName.Trim() : req.Email,
            EmailConfirmed = true,
        };

        var result = await _userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
        {
            var errs = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(new { message = errs.First(), errors = errs });
        }

        // All self-registered accounts are Donors
        if (!await _roleManager.RoleExistsAsync("Donor"))
            await _roleManager.CreateAsync(new IdentityRole("Donor"));

        await _userManager.AddToRoleAsync(user, "Donor");

        // Sign them in immediately after registration
        await _signInManager.SignInAsync(user, isPersistent: false);
        return Ok(new UserResponse(user.Email!, user.DisplayName, ["Donor"]));
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
public record RegisterRequest(string Email, string Password, string? DisplayName);
public record UserResponse(string Email, string? DisplayName, List<string> Roles);
