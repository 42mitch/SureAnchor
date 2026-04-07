using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/public")]
[AllowAnonymous]
public class PublicController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public PublicController(ApplicationDbContext db) => _db = db;

    // ── GET /api/public/impact ────────────────────────────────────────────────
    // Returns aggregated, fully anonymised metrics for the public impact page.
    // No resident names, case numbers, or personally identifying data are exposed.
    [HttpGet("impact")]
    public async Task<IActionResult> GetImpact()
    {
        var today        = DateOnly.FromDateTime(DateTime.UtcNow);
        var twelveAgo    = today.AddMonths(-12);

        // ── Summary stats ──────────────────────────────────────────────────
        var totalResidents   = await _db.Residents.CountAsync();
        var currentlyInCare  = await _db.Residents.CountAsync(r => r.CaseStatus == "Active");
        var activeSafehouses = await _db.Safehouses.CountAsync(s => s.Status == "Active");

        var withReintegration = await _db.Residents
            .CountAsync(r => r.ReintegrationStatus != null && r.ReintegrationStatus != "");

        var successfulReintegration = await _db.Residents
            .CountAsync(r => r.ReintegrationStatus == "Successful"
                          || r.ReintegrationStatus == "Completed"
                          || r.ReintegrationStatus == "Reintegrated");

        var reintegrationRate = withReintegration > 0
            ? (int)Math.Round((double)successfulReintegration / withReintegration * 100)
            : 0;

        var totalDonated = await _db.Donations
            .Where(d => d.Amount.HasValue)
            .SumAsync(d => (decimal?)d.Amount) ?? 0;

        // ── Monthly residents served ───────────────────────────────────────
        // Use safehouse_monthly_metrics if available, otherwise fall back to
        // counting admissions per month (still anonymised).
        var metricRows = await _db.SafehouseMonthlyMetrics
            .Where(m => m.MonthStart >= twelveAgo)
            .GroupBy(m => m.MonthStart)
            .Select(g => new { Month = g.Key, Active = g.Sum(m => (int?)(m.ActiveResidents ?? 0)) ?? 0 })
            .OrderBy(g => g.Month)
            .ToListAsync();

        List<object> monthlyServed;
        if (metricRows.Count > 0)
        {
            monthlyServed = metricRows
                .Select(m => (object)new { month = m.Month.ToString("MMM yy"), served = m.Active })
                .ToList();
        }
        else
        {
            var admissions = await _db.Residents
                .Where(r => r.DateOfAdmission.HasValue && r.DateOfAdmission.Value >= twelveAgo)
                .GroupBy(r => new { r.DateOfAdmission!.Value.Year, r.DateOfAdmission.Value.Month })
                .Select(g => new { g.Key.Year, g.Key.Month, Count = g.Count() })
                .OrderBy(g => g.Year).ThenBy(g => g.Month)
                .ToListAsync();

            monthlyServed = admissions
                .Select(a => (object)new
                {
                    month  = new DateOnly(a.Year, a.Month, 1).ToString("MMM yy"),
                    served = a.Count
                })
                .ToList();
        }

        // ── Donation trend (last 12 months, PHP monetary only) ─────────────
        var donationByMonth = await _db.Donations
            .Where(d => d.DonationDate >= twelveAgo && d.Amount.HasValue)
            .GroupBy(d => new { d.DonationDate.Year, d.DonationDate.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(d => d.Amount ?? 0) })
            .OrderBy(g => g.Year).ThenBy(g => g.Month)
            .ToListAsync();

        var donationTrend = donationByMonth
            .Select(d => new
            {
                month  = new DateOnly(d.Year, d.Month, 1).ToString("MMM yy"),
                amount = d.Total
            })
            .ToList();

        // ── Program allocation (all-time, as percentages) ──────────────────
        var allocRows = await _db.DonationAllocations
            .GroupBy(a => a.ProgramArea)
            .Select(g => new { Program = g.Key, Total = g.Sum(a => a.AmountAllocated) })
            .ToListAsync();

        var allocationTotal = allocRows.Sum(a => a.Total);
        var programAllocation = allocRows
            .Select(a => new
            {
                name  = a.Program,
                value = allocationTotal > 0
                    ? Math.Round((double)a.Total / (double)allocationTotal * 100, 1)
                    : 0.0
            })
            .OrderByDescending(a => a.value)
            .ToList();

        // ── Case category breakdown (anonymised counts) ────────────────────
        var categoryRows = await _db.Residents
            .Where(r => r.CaseCategory != null && r.CaseCategory != "")
            .GroupBy(r => r.CaseCategory!)
            .Select(g => new { Category = g.Key, Count = g.Count() })
            .OrderByDescending(g => g.Count)
            .ToListAsync();

        var caseCategories = categoryRows
            .Select(c => new { name = c.Category, count = c.Count })
            .ToList();

        return Ok(new
        {
            stats = new
            {
                currentlyInCare,
                totalServed          = totalResidents,
                reintegrationSuccessRate = reintegrationRate,
                activeSafehouses,
                totalDonatedPhp      = totalDonated,
            },
            monthlyServed,
            donationTrend,
            programAllocation,
            caseCategories,
        });
    }
}
