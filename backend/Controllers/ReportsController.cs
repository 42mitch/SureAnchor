using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = "Admin,Staff")]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public ReportsController(ApplicationDbContext db) => _db = db;

    // ── GET /api/reports/summary ──────────────────────────────────────────────
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var today        = DateOnly.FromDateTime(DateTime.UtcNow);
        var startOfMonth = new DateOnly(today.Year, today.Month, 1);
        var twelveMonthsAgo = startOfMonth.AddMonths(-11);

        // ── Load all data ─────────────────────────────────────────────────────
        var residents = await _db.Residents
            .Include(r => r.Safehouse)
            .Include(r => r.HealthRecords)
            .Include(r => r.EducationRecords)
            .ToListAsync();

        var donations = await _db.Donations
            .Where(d => d.DonationDate >= twelveMonthsAgo)
            .ToListAsync();

        var safehouses = await _db.Safehouses
            .OrderBy(s => s.SafehouseCode)
            .ToListAsync();

        var incidentsThisMonth = await _db.IncidentReports
            .Where(i => i.IncidentDate >= startOfMonth)
            .Select(i => new { i.IncidentId, i.ResidentId })
            .ToListAsync();

        // ── Reintegration success rate ────────────────────────────────────────
        var withReinteg = residents.Count(r => !string.IsNullOrWhiteSpace(r.ReintegrationStatus));
        var completed   = residents.Count(r => r.ReintegrationStatus == "Completed");
        var successRate = withReinteg > 0
            ? Math.Round((double)completed / withReinteg * 100, 1)
            : 0;

        // ── Average health score (0–5) across all records ─────────────────────
        var allHealthScores = residents
            .SelectMany(r => r.HealthRecords)
            .Select(h => AvgHealthScore(h.GeneralHealthScore, h.NutritionScore,
                                        h.SleepQualityScore, h.EnergyLevelScore))
            .OfType<double>()
            .ToList();
        var globalAvgHealth = allHealthScores.Count > 0
            ? Math.Round(allHealthScores.Average(), 2)
            : 0;

        // ── Average education progress (%) across all records ─────────────────
        var allEduProgress = residents
            .SelectMany(r => r.EducationRecords)
            .Where(e => e.ProgressPercent.HasValue)
            .Select(e => NormalizePercent((double)e.ProgressPercent!.Value))
            .ToList();
        var globalAvgEdu = allEduProgress.Count > 0
            ? Math.Round(allEduProgress.Average(), 1)
            : 0;

        // ── Donation trend — last 12 calendar months ──────────────────────────
        var donationTrend = Enumerable.Range(0, 12)
            .Select(i =>
            {
                var mo    = startOfMonth.AddMonths(-(11 - i));
                var label = mo.ToString("MMM yyyy");
                var total = donations
                    .Where(d => d.DonationDate.Year == mo.Year && d.DonationDate.Month == mo.Month
                                && (d.Amount.HasValue || d.EstimatedValue.HasValue))
                    .Sum(d => (double)(d.Amount ?? d.EstimatedValue ?? 0));
                return new DonationTrendPoint(label, Math.Round(total, 2));
            })
            .ToList();

        // ── Per-safehouse aggregations ────────────────────────────────────────
        var safehouseOutcomes     = new List<SafehouseOutcomePoint>();
        var safehousePerformance  = new List<SafehousePerformanceRow>();
        var incidentResidentIds   = incidentsThisMonth.Select(i => i.ResidentId).ToHashSet();

        foreach (var sh in safehouses)
        {
            var shResidents = residents.Where(r => r.SafehouseId == sh.SafehouseId).ToList();
            var activeCount = shResidents.Count(r =>
                r.CaseStatus == "Active" || r.CaseStatus == "Reintegrating");

            // Health — average score per safehouse (0–5 → scale to 0–100)
            var shHealthRaw = shResidents
                .SelectMany(r => r.HealthRecords)
                .Select(h => AvgHealthScore(h.GeneralHealthScore, h.NutritionScore,
                                            h.SleepQualityScore, h.EnergyLevelScore))
                .OfType<double>()
                .ToList();
            var shHealth100 = shHealthRaw.Count > 0
                ? Math.Round(shHealthRaw.Average() * 20, 1)   // 0–5 → 0–100
                : 0;

            // Education progress
            var shEduRaw = shResidents
                .SelectMany(r => r.EducationRecords)
                .Where(e => e.ProgressPercent.HasValue)
                .Select(e => NormalizePercent((double)e.ProgressPercent!.Value))
                .ToList();
            var shEdu = shEduRaw.Count > 0
                ? Math.Round(shEduRaw.Average(), 1)
                : 0;

            // Incidents this calendar month for residents in this safehouse
            var shResidentIds = shResidents.Select(r => r.ResidentId).ToHashSet();
            var shIncidents   = incidentResidentIds.Count(rid => shResidentIds.Contains(rid));

            var displayName = sh.Name;
            safehouseOutcomes.Add(new SafehouseOutcomePoint(displayName, shHealth100, shEdu));
            safehousePerformance.Add(new SafehousePerformanceRow(
                displayName, activeCount, shHealth100, shEdu, shIncidents));
        }

        return Ok(new ReportsSummaryDto(
            successRate,
            globalAvgHealth,
            globalAvgEdu,
            donationTrend,
            safehouseOutcomes,
            safehousePerformance
        ));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// Average the up-to-4 wellbeing scores, normalising legacy 0–10 values to 0–5.
    private static double? AvgHealthScore(
        decimal? g, decimal? n, decimal? s, decimal? e)
    {
        var vals = new[] { g, n, s, e }
            .Where(v => v.HasValue)
            .Select(v => v!.Value > 5 ? (double)(v.Value / 2) : (double)v.Value)
            .ToList();
        return vals.Count > 0 ? vals.Average() : null;
    }

    /// EF stores progress as a ratio (0–1) or a percentage (>1). Normalise to 0–100.
    private static double NormalizePercent(double raw) =>
        raw is >= 0 and <= 1 ? raw * 100 : raw;
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record ReportsSummaryDto(
    double ReintegrationSuccessRate,   // 0–100
    double AvgHealthScore,             // 0–5
    double AvgEducationProgress,       // 0–100 percent
    List<DonationTrendPoint>     DonationTrend,
    List<SafehouseOutcomePoint>  SafehouseOutcomes,
    List<SafehousePerformanceRow> SafehousePerformance
);

public record DonationTrendPoint(string Month, double Amount);

public record SafehouseOutcomePoint(
    string Safehouse,
    double Health,      // 0–100  (divide by 20 for /5 display)
    double Education    // 0–100
);

public record SafehousePerformanceRow(
    string Name,
    int    Residents,
    double HealthScore,       // 0–100
    double EducationProgress, // 0–100
    int    Incidents
);
