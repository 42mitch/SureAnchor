using System.Security.Claims;
using Backend.Models;
using Microsoft.AspNetCore.Authentication.Google;
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
    private readonly IConfiguration _configuration;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration)
    {
        _userManager   = userManager;
        _signInManager = signInManager;
        _roleManager   = roleManager;
        _configuration = configuration;
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
            UserName       = req.Email,
            Email          = req.Email,
            DisplayName    = req.DisplayName?.Trim().Length > 0 ? req.DisplayName.Trim() : req.Email,
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

        // Create a Supporter record immediately so country is stored
        var db = HttpContext.RequestServices.GetRequiredService<Backend.Data.ApplicationDbContext>();
        var nextId = (db.Supporters.Any() ? db.Supporters.Max(s => s.SupporterId) : 0) + 1;
        var supporter = new Supporter
        {
            SupporterId        = nextId,
            SupporterType      = "MonetaryDonor",
            DisplayName        = user.DisplayName ?? user.Email ?? req.Email,
            Email              = user.Email,
            Country            = string.IsNullOrWhiteSpace(req.Country) ? null : req.Country.Trim(),
            Status             = "Active",
            CreatedAt          = DateTime.UtcNow,
            AcquisitionChannel = "Website",
        };
        db.Supporters.Add(supporter);
        await db.SaveChangesAsync();

        user.SupporterId = supporter.SupporterId;
        await _userManager.UpdateAsync(user);

        // Sign them in immediately after registration
        await _signInManager.SignInAsync(user, isPersistent: false);
        return Ok(new UserResponse(user.Email!, user.DisplayName, ["Donor"]));
    }

    // ── GET /api/auth/google/signin ───────────────────────────────────────────
    // Initiates the Google OAuth flow. The browser is redirected to Google's
    // consent screen. No credentials required — anyone can start this flow.
    [HttpGet("google/signin")]
    [AllowAnonymous]
    public IActionResult GoogleSignIn()
    {
        var clientId = _configuration["Authentication:Google:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
        {
            var frontendUrl = _configuration["App:FrontendUrl"]
                              ?? "https://zealous-tree-029394910.6.azurestaticapps.net";
            return Redirect($"{frontendUrl}/login?error=google_failed");
        }

        // After the OAuth middleware processes the Google callback at /signin-google,
        // it will redirect the browser to this action URL.
        var callbackUrl = Url.Action(nameof(GoogleCallback), "Auth", null, Request.Scheme);
        var properties  = _signInManager.ConfigureExternalAuthenticationProperties(
            GoogleDefaults.AuthenticationScheme, callbackUrl);
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    // ── GET /api/auth/google/callback ─────────────────────────────────────────
    // Called by the Google OAuth middleware after it has validated the token.
    // Creates or links the user account, signs them in, then redirects to the
    // frontend donor portal.
    [HttpGet("google/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> GoogleCallback()
    {
        var frontendUrl = _configuration["App:FrontendUrl"]
                          ?? "https://zealous-tree-029394910.6.azurestaticapps.net";

        var info = await _signInManager.GetExternalLoginInfoAsync();
        if (info == null)
            return Redirect($"{frontendUrl}/login?error=google_failed");

        // ── Case 1: existing Google login link ────────────────────────────────
        var signInResult = await _signInManager.ExternalLoginSignInAsync(
            info.LoginProvider, info.ProviderKey,
            isPersistent: true, bypassTwoFactor: false);

        if (signInResult.Succeeded)
        {
            var linkedUser  = await _userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
            var linkedRoles = linkedUser != null ? await _userManager.GetRolesAsync(linkedUser) : [];
            var dest        = linkedRoles.Contains("Admin") || linkedRoles.Contains("Staff") ? "/admin" : "/donor";
            return Redirect($"{frontendUrl}{dest}");
        }

        var email = info.Principal.FindFirstValue(ClaimTypes.Email);
        var name  = info.Principal.FindFirstValue(ClaimTypes.Name);

        if (string.IsNullOrEmpty(email))
            return Redirect($"{frontendUrl}/login?error=no_email");

        // ── Case 2: password account exists with the same email ───────────────
        var user = await _userManager.FindByEmailAsync(email);
        if (user != null)
        {
            await _userManager.AddLoginAsync(user, info);
            await _signInManager.SignInAsync(user, isPersistent: true);
            var userRoles = await _userManager.GetRolesAsync(user);
            var dest      = userRoles.Contains("Admin") || userRoles.Contains("Staff") ? "/admin" : "/donor";
            return Redirect($"{frontendUrl}{dest}");
        }

        // ── Case 3: brand new user — create a Donor account ──────────────────
        user = new ApplicationUser
        {
            UserName       = email,
            Email          = email,
            DisplayName    = !string.IsNullOrWhiteSpace(name) ? name.Trim() : email,
            EmailConfirmed = true,
        };

        var createResult = await _userManager.CreateAsync(user);
        if (!createResult.Succeeded)
            return Redirect($"{frontendUrl}/login?error=create_failed");

        await _userManager.AddLoginAsync(user, info);

        if (!await _roleManager.RoleExistsAsync("Donor"))
            await _roleManager.CreateAsync(new IdentityRole("Donor"));
        await _userManager.AddToRoleAsync(user, "Donor");

        await _signInManager.SignInAsync(user, isPersistent: true);
        return Redirect($"{frontendUrl}/donor");
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
public record RegisterRequest(string Email, string Password, string? DisplayName, string? Country);
public record UserResponse(string Email, string? DisplayName, List<string> Roles);