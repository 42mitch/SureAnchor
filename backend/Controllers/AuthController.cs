using System.Security.Claims;
using Backend.Data;
using Backend.Models;
using Backend.Services;
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
    private readonly EmailService _email;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        EmailService email)
    {
        _userManager   = userManager;
        _signInManager = signInManager;
        _roleManager   = roleManager;
        _configuration = configuration;
        _email         = email;
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
        return Ok(new UserResponse(user.Email!, user.DisplayName, [.. roles], user.EmailConfirmed));
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
            EmailConfirmed = false, // requires confirmation
        };

        var result = await _userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
        {
            var errs = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(new { message = errs.First(), errors = errs });
        }

        if (!await _roleManager.RoleExistsAsync("Donor"))
            await _roleManager.CreateAsync(new IdentityRole("Donor"));
        await _userManager.AddToRoleAsync(user, "Donor");

        // Create Supporter record immediately
        var db     = HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
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

        // Send confirmation email
        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        _ = Task.Run(async () =>
        {
            try { await _email.SendEmailConfirmationAsync(user.Email!, user.DisplayName ?? user.Email!, token); }
            catch { }
        });

        await _signInManager.SignInAsync(user, isPersistent: false);
        return Ok(new UserResponse(user.Email!, user.DisplayName, ["Donor"], false));
    }

    // ── POST /api/auth/confirm-email ──────────────────────────────────────────
    [HttpPost("confirm-email")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailRequest req)
    {
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null) return BadRequest(new { message = "Invalid confirmation link." });

        var result = await _userManager.ConfirmEmailAsync(user, req.Token);
        if (!result.Succeeded)
            return BadRequest(new { message = "Invalid or expired confirmation link." });

        return Ok(new { message = "Email confirmed successfully." });
    }

    // ── POST /api/auth/resend-confirmation ────────────────────────────────────
    [HttpPost("resend-confirmation")]
    [Authorize]
    public async Task<IActionResult> ResendConfirmation()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();
        if (user.EmailConfirmed) return BadRequest(new { message = "Email is already confirmed." });

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        _ = Task.Run(async () =>
        {
            try { await _email.SendEmailConfirmationAsync(user.Email!, user.DisplayName ?? user.Email!, token); }
            catch { }
        });

        return Ok(new { message = "Confirmation email sent." });
    }

    // ── POST /api/auth/forgot-password ────────────────────────────────────────
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        // Always return OK to avoid email enumeration
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user != null && user.EmailConfirmed)
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            _ = Task.Run(async () =>
            {
                try { await _email.SendPasswordResetAsync(user.Email!, user.DisplayName ?? user.Email!, token); }
                catch { }
            });
        }
        return Ok(new { message = "If an account with that email exists, a reset link has been sent." });
    }

    // ── POST /api/auth/reset-password ─────────────────────────────────────────
    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null) return BadRequest(new { message = "Invalid reset link." });

        var result = await _userManager.ResetPasswordAsync(user, req.Token, req.NewPassword);
        if (!result.Succeeded)
        {
            var errs = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(new { message = errs.First(), errors = errs });
        }
        return Ok(new { message = "Password reset successfully." });
    }

    // ── GET /api/auth/google/signin ───────────────────────────────────────────
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

        var callbackUrl = Url.Action(nameof(GoogleCallback), "Auth", null, Request.Scheme);
        var properties  = _signInManager.ConfigureExternalAuthenticationProperties(
            GoogleDefaults.AuthenticationScheme, callbackUrl);
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    // ── GET /api/auth/google/callback ─────────────────────────────────────────
    [HttpGet("google/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> GoogleCallback()
    {
        var frontendUrl = _configuration["App:FrontendUrl"]
                          ?? "https://zealous-tree-029394910.6.azurestaticapps.net";

        var info = await _signInManager.GetExternalLoginInfoAsync();
        if (info == null)
            return Redirect($"{frontendUrl}/login?error=google_failed");

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

        var user = await _userManager.FindByEmailAsync(email);
        if (user != null)
        {
            await _userManager.AddLoginAsync(user, info);
            await _signInManager.SignInAsync(user, isPersistent: true);
            var userRoles = await _userManager.GetRolesAsync(user);
            var dest      = userRoles.Contains("Admin") || userRoles.Contains("Staff") ? "/admin" : "/donor";
            return Redirect($"{frontendUrl}{dest}");
        }

        user = new ApplicationUser
        {
            UserName       = email,
            Email          = email,
            DisplayName    = !string.IsNullOrWhiteSpace(name) ? name.Trim() : email,
            EmailConfirmed = true, // Google already verified
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
        return Ok(new UserResponse(user.Email!, user.DisplayName, [.. roles], user.EmailConfirmed));
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record LoginRequest(string Email, string Password);
public record RegisterRequest(string Email, string Password, string? DisplayName, string? Country);
public record UserResponse(string Email, string? DisplayName, List<string> Roles, bool EmailConfirmed);
public record ConfirmEmailRequest(string Email, string Token);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Token, string NewPassword);