using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Google;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddControllers();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
        sql => sql.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null)));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.Password.RequiredLength = 14;
        options.Password.RequireDigit = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequiredUniqueChars = 1;

        options.User.RequireUniqueEmail = true;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.SlidingExpiration = true;

    options.Cookie.SameSite = builder.Environment.IsDevelopment()
        ? SameSiteMode.Lax
        : SameSiteMode.None;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;

    options.Events.OnRedirectToLogin = ctx =>
    {
        ctx.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = ctx =>
    {
        ctx.Response.StatusCode = 403;
        return Task.CompletedTask;
    };
});

// Google OAuth — only registered when credentials are present
// Azure env var names use double-underscore: Authentication__Google__ClientId
var googleClientId     = builder.Configuration["Authentication:Google:ClientId"];
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];

if (!string.IsNullOrWhiteSpace(googleClientId) && !string.IsNullOrWhiteSpace(googleClientSecret))
{
    builder.Services.AddAuthentication()
        .AddGoogle(options =>
        {
            options.ClientId     = googleClientId;
            options.ClientSecret = googleClientSecret;
            // Authorized redirect URI to register in Google Cloud Console:
            //   Production:  https://sure-anchor.azurewebsites.net/signin-google
            //   Local dev:   http://localhost:5022/signin-google
        });
}

// Configure HSTS for production.
// Azure App Service terminates TLS at the load balancer, so we can't rely on
// IsHttps being true inside the app. We configure HSTS here and let
// UseForwardedHeaders (below) ensure the request context reflects the real
// protocol. max-age of 1 year (31536000s) with includeSubDomains matches
// the header set on the frontend SWA config.
builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromDays(365);
    options.IncludeSubDomains = true;
    options.Preload = false; // Only set to true after confirming the site is
                             // fully HTTPS-only and you want HSTS preload list
                             // submission — this is a one-way commitment.
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var configuredOrigins = builder.Configuration["Cors:AllowedOrigins"]?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            ?? Array.Empty<string>();

        var allowedOrigins = configuredOrigins.Length > 0
            ? configuredOrigins
            : new[]
            {
                "http://localhost:5173",
                "https://zealous-tree-029394910.6.azurestaticapps.net"
            };

        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Respect X-Forwarded-* headers from Azure's reverse proxy.
// This must come before UseHsts and UseHttpsRedirection so that
// Request.IsHttps is correctly set to true for HTTPS requests that
// were terminated at the load balancer.
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

// HSTS: only active outside of development. Because ForwardedHeaders runs
// first, Request.IsHttps will be true for real HTTPS traffic and the
// middleware will correctly emit the Strict-Transport-Security header.
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

// Manually stamp CORS headers so they survive even on 500 responses.
string[] corsOrigins = [
    "http://localhost:5173",
    "https://zealous-tree-029394910.6.azurestaticapps.net"
];
app.Use(async (ctx, next) =>
{
    var origin = ctx.Request.Headers.Origin.ToString();
    if (corsOrigins.Contains(origin))
    {
        ctx.Response.Headers["Access-Control-Allow-Origin"]      = origin;
        ctx.Response.Headers["Access-Control-Allow-Credentials"] = "true";
        ctx.Response.Headers["Access-Control-Allow-Headers"]     = "Content-Type, Authorization";
        ctx.Response.Headers["Access-Control-Allow-Methods"]     = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
        ctx.Response.Headers["Vary"]                             = "Origin";
    }
    if (ctx.Request.Method == "OPTIONS")
    {
        ctx.Response.StatusCode = 204;
        return;
    }
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        ctx.Response.StatusCode      = 500;
        ctx.Response.ContentType     = "application/json";
        await ctx.Response.WriteAsJsonAsync(new { error = ex.Message, detail = ex.InnerException?.Message });
    }
});

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/api/hello", () =>
{
    return Results.Ok(new { message = "Hello from backend!" });
});

app.Run();