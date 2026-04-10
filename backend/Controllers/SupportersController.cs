using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/supporters")]
[Authorize(Roles = "Admin,Staff")]
public class SupportersController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public SupportersController(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

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

        var dto = new SupporterDetailDto(
            s.SupporterId,
            s.DisplayName,
            s.SupporterType,
            s.FirstName,
            s.LastName,
            s.OrganizationName,
            s.Email,
            s.Phone,
            s.Country,
            s.Region,
            s.RelationshipType,
            s.AcquisitionChannel,
            s.Status,
            s.FirstDonationDate?.ToString("yyyy-MM-dd"),
            s.CreatedAt.ToString("yyyy-MM-dd"),
            s.Donations.OrderByDescending(d => d.DonationDate).Select(d => new SupporterDonationDto(
                d.DonationId,
                d.DonationType,
                d.DonationDate.ToString("yyyy-MM-dd"),
                d.IsRecurring,
                d.CampaignName,
                d.ChannelSource,
                d.CurrencyCode ?? "PHP",
                d.Amount,
                d.EstimatedValue,
                d.ImpactUnit,
                d.Notes
            )).ToList()
        );
        return Ok(dto);
    }

    // ── POST /api/supporters ──────────────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SupporterWriteDto dto)
    {
        var supporter = new Supporter
        {
            SupporterId = (_db.Supporters.Any() ? _db.Supporters.Max(s => s.SupporterId) : 0) + 1,
            DisplayName = dto.DisplayName,
            SupporterType = dto.SupporterType,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            OrganizationName = dto.OrganizationName,
            Email = dto.Email,
            Phone = dto.Phone,
            Country = dto.Country,
            Status = dto.Status ?? "Active",
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
        supporter.Status = dto.Status ?? supporter.Status;
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

        // If the donor has a linked login account (e.g. Google SSO), delete it
        // first to avoid FK constraint violation on supporters.supporter_id.
        var linkedUser = await _userManager.Users
            .FirstOrDefaultAsync(u => u.SupporterId == id);
        if (linkedUser != null)
            await _userManager.DeleteAsync(linkedUser);

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

public record SupporterDetailDto(
    int SupporterId,
    string DisplayName,
    string SupporterType,
    string? FirstName,
    string? LastName,
    string? OrganizationName,
    string? Email,
    string? Phone,
    string? Country,
    string? Region,
    string? RelationshipType,
    string? AcquisitionChannel,
    string Status,
    string? FirstDonationDate,
    string CreatedAt,
    List<SupporterDonationDto> Donations
);

public record SupporterDonationDto(
    int DonationId,
    string DonationType,
    string DonationDate,
    bool IsRecurring,
    string? CampaignName,
    string? ChannelSource,
    string CurrencyCode,
    decimal? Amount,
    decimal? EstimatedValue,
    string? ImpactUnit,
    string? Notes
);

// Status is nullable to satisfy .NET 10's stricter validation metadata rules
// for record primary constructors — [property: Required] on a non-nullable
// string in a record DTO causes a 500 in .NET 10. Controllers default to
// "Active" when null is received.
// Note: [property: ...] data annotation attributes on record primary constructor
// parameters are not supported in .NET 10 and cause 500 errors. Validation is
// handled on the frontend instead.
public record SupporterWriteDto(
    string DisplayName,
    string SupporterType,
    string? FirstName,
    string? LastName,
    string? OrganizationName,
    string? Email,
    string? Phone,
    string? Country,
    string? Status,
    string? AcquisitionChannel
);