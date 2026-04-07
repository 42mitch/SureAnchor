using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/supporters")]
[Authorize(Roles = "Admin,Staff")]
public class SupportersController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public SupportersController(ApplicationDbContext db) => _db = db;

    // ── GET /api/supporters ───────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.Supporters
            .Select(s => new SupporterListDto(
                s.SupporterId,
                s.DisplayName,
                s.SupporterType,
                s.Status,
                s.Donations.Where(d => d.Amount.HasValue).Sum(d => (decimal?)d.Amount) ?? 0,
                s.Donations.OrderByDescending(d => d.DonationDate).Select(d => d.DonationDate.ToString()).FirstOrDefault(),
                s.Country,
                s.Email
            ))
            .ToListAsync();
        return Ok(list);
    }

    // ── GET /api/supporters/{id} ──────────────────────────────────────────────
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var s = await _db.Supporters
            .Include(s => s.Donations)
            .FirstOrDefaultAsync(s => s.SupporterId == id);
        if (s == null) return NotFound();
        return Ok(s);
    }

    // ── POST /api/supporters ──────────────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SupporterWriteDto dto)
    {
        var supporter = new Supporter
        {
            DisplayName = dto.DisplayName,
            SupporterType = dto.SupporterType,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            OrganizationName = dto.OrganizationName,
            Email = dto.Email,
            Phone = dto.Phone,
            Country = dto.Country,
            Status = dto.Status,
            AcquisitionChannel = dto.AcquisitionChannel,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Supporters.Add(supporter);
        await _db.SaveChangesAsync();
        return Ok(new { supporter.SupporterId });
    }

    // ── PUT /api/supporters/{id} ──────────────────────────────────────────────
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SupporterWriteDto dto)
    {
        var supporter = await _db.Supporters.FindAsync(id);
        if (supporter == null) return NotFound();

        supporter.DisplayName = dto.DisplayName;
        supporter.SupporterType = dto.SupporterType;
        supporter.FirstName = dto.FirstName;
        supporter.LastName = dto.LastName;
        supporter.OrganizationName = dto.OrganizationName;
        supporter.Email = dto.Email;
        supporter.Phone = dto.Phone;
        supporter.Country = dto.Country;
        supporter.Status = dto.Status;
        supporter.AcquisitionChannel = dto.AcquisitionChannel;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── DELETE /api/supporters/{id} ───────────────────────────────────────────
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var supporter = await _db.Supporters.FindAsync(id);
        if (supporter == null) return NotFound();
        _db.Supporters.Remove(supporter);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record SupporterListDto(
    int SupporterId,
    string DisplayName,
    string SupporterType,
    string Status,
    decimal TotalDonated,
    string? LastDonationDate,
    string? Country,
    string? Email
);

public record SupporterWriteDto(
    string DisplayName,
    string SupporterType,
    string? FirstName,
    string? LastName,
    string? OrganizationName,
    string? Email,
    string? Phone,
    string? Country,
    string Status,
    string? AcquisitionChannel
);
