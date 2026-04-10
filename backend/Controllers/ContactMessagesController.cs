using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/contact-messages")]
public class ContactMessagesController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly EmailService _email;

    public ContactMessagesController(ApplicationDbContext db, EmailService email)
    {
        _db    = db;
        _email = email;
    }

    // ── POST /api/contact-messages ────────────────────────────────────────────
    // Public — anyone can submit a contact form
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Submit([FromBody] ContactMessageWriteDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest(new { message = "Name, email, and message are required." });

        var msg = new ContactMessage
        {
            Name      = dto.Name.Trim(),
            Email     = dto.Email.Trim(),
            Topic     = dto.Topic?.Trim(),
            Message   = dto.Message.Trim(),
            CreatedAt = DateTime.UtcNow,
        };
        _db.ContactMessages.Add(msg);
        await _db.SaveChangesAsync();

        // Fire and forget — don't fail the request if email fails
        _ = Task.Run(async () =>
        {
            try { await _email.SendContactNotificationAsync(msg.Name, msg.Email, msg.Topic, msg.Message); }
            catch { /* log in production */ }
        });

        return Ok(new { message = "Message sent successfully." });
    }

    // ── GET /api/contact-messages ─────────────────────────────────────────────
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll([FromQuery] bool? resolved)
    {
        var query = _db.ContactMessages.AsQueryable();
        if (resolved.HasValue)
            query = query.Where(m => m.IsResolved == resolved.Value);

        var list = await query
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new ContactMessageDto(
                m.ContactMessageId,
                m.Name,
                m.Email,
                m.Topic,
                m.Message,
                m.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
                m.IsResolved,
                m.ResolvedAt.HasValue ? m.ResolvedAt.Value.ToString("yyyy-MM-dd HH:mm") : null
            ))
            .ToListAsync();

        return Ok(list);
    }

    // ── GET /api/contact-messages/unresolved-count ────────────────────────────
    [HttpGet("unresolved-count")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUnresolvedCount()
    {
        var count = await _db.ContactMessages.CountAsync(m => !m.IsResolved);
        return Ok(new { count });
    }

    // ── PATCH /api/contact-messages/{id}/resolve ──────────────────────────────
    [HttpPatch("{id:int}/resolve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Resolve(int id)
    {
        var msg = await _db.ContactMessages.FindAsync(id);
        if (msg == null) return NotFound();

        msg.IsResolved = true;
        msg.ResolvedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── PATCH /api/contact-messages/{id}/unresolve ────────────────────────────
    [HttpPatch("{id:int}/unresolve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Unresolve(int id)
    {
        var msg = await _db.ContactMessages.FindAsync(id);
        if (msg == null) return NotFound();

        msg.IsResolved = false;
        msg.ResolvedAt = null;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record ContactMessageWriteDto(
    string Name,
    string Email,
    string? Topic,
    string Message
);

public record ContactMessageDto(
    int ContactMessageId,
    string Name,
    string Email,
    string? Topic,
    string Message,
    string CreatedAt,
    bool IsResolved,
    string? ResolvedAt
);