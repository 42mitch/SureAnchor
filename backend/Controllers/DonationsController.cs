using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/donations")]
[Authorize(Roles = "Admin,Staff,Donor")]
public class DonationsController : ControllerBase
{
    private static bool TryParseDonationDate(string? raw, out DateOnly parsed, out string? error)
    {
        parsed = default;
        error = null;
        if (!DateOnly.TryParse(raw, out parsed))
        {
            error = "DonationDate must be a valid date.";
            return false;
        }
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (parsed > today)
        {
            error = "DonationDate cannot be in the future.";
            return false;
        }
        return true;
    }

    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public DonationsController(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    // ── GET /api/donations ────────────────────────────────────────────────────
    // Admin/Staff: all donations
    // Donor: only their own (filtered by supporter_id on their account)
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        IQueryable<Donation> query = _db.Donations.Include(d => d.Supporter);

        if (User.IsInRole("Donor"))
        {
            var appUser = await _userManager.GetUserAsync(User);
            if (appUser?.SupporterId == null)
                return Ok(Array.Empty<DonationDto>());

            query = query.Where(d => d.SupporterId == appUser.SupporterId);
        }

        var list = await query
            .OrderByDescending(d => d.DonationDate)
            .Select(d => new DonationDto(
                d.DonationId,
                d.SupporterId,
                d.Supporter.DisplayName,
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
            ))
            .ToListAsync();
        return Ok(list);
    }

    // ── GET /api/donations/my-impact ──────────────────────────────────────────
    // Donor-only: shows allocations (impact) from their donations
    [HttpGet("my-impact")]
    [Authorize(Roles = "Donor")]
    public async Task<IActionResult> GetMyImpact()
    {
        var appUser = await _userManager.GetUserAsync(User);
        if (appUser?.SupporterId == null)
            return Ok(Array.Empty<object>());

        var allocations = await _db.DonationAllocations
            .Include(a => a.Donation)
            .Include(a => a.Safehouse)
            .Where(a => a.Donation.SupporterId == appUser.SupporterId)
            .Select(a => new
            {
                a.AllocationId,
                a.DonationId,
                a.Safehouse.Name,
                a.ProgramArea,
                a.AmountAllocated,
                AllocationDate = a.AllocationDate.ToString("yyyy-MM-dd"),
            })
            .ToListAsync();
        return Ok(allocations);
    }

    // ── POST /api/donations/give ──────────────────────────────────────────────
    // Donor self-service: submit their own donation (creates Supporter if needed)
    [HttpPost("give")]
    [Authorize(Roles = "Donor")]
    public async Task<IActionResult> Give([FromBody] DonorGiveDto dto)
    {
        string stage = "load-user";
        try
        {
            var appUser = await _userManager.GetUserAsync(User);
            if (appUser == null) return Unauthorized();

            // Auto-create a Supporter record if the donor doesn't have one yet
            if (appUser.SupporterId == null)
            {
                stage = "create-supporter";
                var nextId = (_db.Supporters.Any() ? _db.Supporters.Max(s => s.SupporterId) : 0) + 1;
                var supporter = new Supporter
                {
                    SupporterId        = nextId,
                    SupporterType      = "MonetaryDonor",
                    DisplayName        = appUser.DisplayName ?? appUser.Email ?? "Donor",
                    Email              = appUser.Email,
                    Status             = "Active",
                    CreatedAt          = DateTime.UtcNow,
                    FirstDonationDate  = DateOnly.FromDateTime(DateTime.UtcNow),
                    AcquisitionChannel = "Website",
                };
                _db.Supporters.Add(supporter);
                await _db.SaveChangesAsync();

                stage = "link-supporter";
                appUser.SupporterId = supporter.SupporterId;
                var updateResult = await _userManager.UpdateAsync(appUser);
                if (!updateResult.Succeeded)
                    return StatusCode(500, new { error = "Failed to link supporter to user.", detail = string.Join("; ", updateResult.Errors.Select(e => e.Description)), stage });
            }

            stage = "resolve-supporter-id";
            var supporterId = appUser.SupporterId;
            if (supporterId == null)
                return StatusCode(500, new { error = "Could not resolve donor supporter record.", stage });

            stage = "create-donation";
            var nextDonationId = (_db.Donations.Any() ? _db.Donations.Max(d => d.DonationId) : 0) + 1;
            var donation = new Donation
            {
                DonationId    = nextDonationId,
                SupporterId   = supporterId.Value,
                DonationType  = "Monetary",
                DonationDate  = DateOnly.FromDateTime(DateTime.UtcNow),
                IsRecurring   = false,
                CampaignName  = string.IsNullOrWhiteSpace(dto.CampaignName) ? null : dto.CampaignName,
                ChannelSource = "Direct",
                CurrencyCode  = "PHP",
                Amount        = dto.Amount,
                ImpactUnit    = "pesos",
                Notes         = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes,
            };
            _db.Donations.Add(donation);
            await _db.SaveChangesAsync();
            return Ok(new { donation.DonationId, message = "Thank you for your donation!" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                error  = ex.Message,
                detail = ex.InnerException?.Message,
                stage
            });
        }
    }

    // ── POST /api/donations ───────────────────────────────────────────────────
    [HttpPost]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Create([FromBody] DonationWriteDto dto)
    {
        if (!TryParseDonationDate(dto.DonationDate, out var donationDate, out var dateError))
            return BadRequest(new { error = dateError });

        var donation = new Donation
        {
            SupporterId = dto.SupporterId,
            DonationType = dto.DonationType,
            DonationDate = donationDate,
            IsRecurring = dto.IsRecurring,
            CampaignName = dto.CampaignName,
            ChannelSource = dto.ChannelSource,
            CurrencyCode = dto.CurrencyCode ?? "PHP",
            Amount = dto.Amount,
            EstimatedValue = dto.EstimatedValue,
            ImpactUnit = dto.ImpactUnit,
            Notes = dto.Notes,
        };
        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();
        return Ok(new { donation.DonationId });
    }

    // ── PUT /api/donations/{id} ───────────────────────────────────────────────
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] DonationWriteDto dto)
    {
        if (!TryParseDonationDate(dto.DonationDate, out var donationDate, out var dateError))
            return BadRequest(new { error = dateError });

        var donation = await _db.Donations.FindAsync(id);
        if (donation == null) return NotFound();

        donation.SupporterId = dto.SupporterId;
        donation.DonationType = dto.DonationType;
        donation.DonationDate = donationDate;
        donation.IsRecurring = dto.IsRecurring;
        donation.CampaignName = dto.CampaignName;
        donation.ChannelSource = dto.ChannelSource;
        donation.CurrencyCode = dto.CurrencyCode ?? "PHP";
        donation.Amount = dto.Amount;
        donation.EstimatedValue = dto.EstimatedValue;
        donation.ImpactUnit = dto.ImpactUnit;
        donation.Notes = dto.Notes;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── DELETE /api/donations/{id} ────────────────────────────────────────────
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var donation = await _db.Donations.FindAsync(id);
        if (donation == null) return NotFound();
        _db.Donations.Remove(donation);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record DonationDto(
    int DonationId,
    int SupporterId,
    string DonorName,
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

// Note: data annotation attributes on record primary constructor parameters
// are not supported in .NET 10 and cause 500 errors. Validation is handled
// on the frontend and via the TryParseDonationDate helper instead.
public record DonorGiveDto(
    decimal Amount,
    string? CampaignName,
    string? Notes
);

public record DonationWriteDto(
    int SupporterId,
    string DonationType,
    string DonationDate,
    bool IsRecurring,
    string? CampaignName,
    string? ChannelSource,
    string? CurrencyCode,
    decimal? Amount,
    decimal? EstimatedValue,
    string? ImpactUnit,
    string? Notes
);