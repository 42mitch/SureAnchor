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
        var today           = DateOnly.FromDateTime(DateTime.UtcNow);
        var startOfMonth    = new DateOnly(today.Year, today.Month, 1);
        var startOfYear     = new DateOnly(today.Year, 1, 1);
        var twelveMonthsAgo = startOfMonth.AddMonths(-11);

        // ── Load data ─────────────────────────────────────────────────────────
        var residents = await _db.Residents
            .Include(r => r.Safehouse)
            .Include(r => r.HealthRecords)
            .Include(r => r.EducationRecords)
            .ToListAsync();

        // Service record counts (all-time totals for the accomplishment report)
        var sessionCount      = await _db.ProcessRecordings.CountAsync();
        var visitationCount   = await _db.HomeVisitations.CountAsync();
        var healthCount       = await _db.HealthWellbeingRecords.CountAsync();
        var educationCount    = await _db.EducationRecords.CountAsync();
        var interventionCount = await _db.InterventionPlans.CountAsync();

        var donations = await _db.Donations
            .Where(d => d.DonationDate >= twelveMonthsAgo)
            .ToListAsync();

        var safehouses = await _db.Safehouses
            .OrderBy(s => s.SafehouseCode)
            .ToListAsync();

        var incidentsThisMonth = await _db.IncidentReports
            .Where(i => i.IncidentDate >= startOfMonth)
            .Select(i => new { i.ResidentId })
            .ToListAsync();

        // ── Beneficiary counts ────────────────────────────────────────────────
        var totalBeneficiaries   = residents.Count;
        var activeCases          = residents.Count(r => r.CaseStatus == "Active");
        var newAdmissionsThisYear = residents.Count(r =>
            r.DateOfAdmission.HasValue && r.DateOfAdmission.Value >= startOfYear);
        var reintegratedCompleted = residents.Count(r =>
            r.ReintegrationStatus == "Completed");

        // ── Services rendered ─────────────────────────────────────────────────
        // Caring  : home visitations
        // Healing : counseling sessions + health assessments
        // Teaching: education records + intervention plans (educational category)
        var educationalPlans = await _db.InterventionPlans
            .CountAsync(p => p.PlanCategory == "Educational");

        // ── Case composition ──────────────────────────────────────────────────
        var byStatus = residents
            .GroupBy(r => string.IsNullOrWhiteSpace(r.CaseStatus) ? "Unknown" : r.CaseStatus)
            .Select(g => new CategoryCount(g.Key, g.Count()))
            .OrderByDescending(c => c.Count)
            .ToList();

        var byRisk = residents
            .Where(r => !string.IsNullOrWhiteSpace(r.CurrentRiskLevel))
            .GroupBy(r => r.CurrentRiskLevel!)
            .Select(g => new CategoryCount(g.Key, g.Count()))
            // Custom risk order
            .OrderBy(c => c.Label switch {
                "Critical" => 0, "High" => 1, "Medium" => 2, "Low" => 3, _ => 4 })
            .ToList();

        // Sub-category breakdown — only non-zero flags
        var subcategories = new List<CategoryCount>
        {
            new("Trafficked",      residents.Count(r => r.SubCatTrafficked)),
            new("Physical Abuse",  residents.Count(r => r.SubCatPhysicalAbuse)),
            new("Sexual Abuse",    residents.Count(r => r.SubCatSexualAbuse)),
            new("Child Labor",     residents.Count(r => r.SubCatChildLabor)),
            new("OSAEC",           residents.Count(r => r.SubCatOsaec)),
            new("CICL",            residents.Count(r => r.SubCatCicl)),
            new("At Risk",         residents.Count(r => r.SubCatAtRisk)),
            new("Orphaned",        residents.Count(r => r.SubCatOrphaned)),
            new("Street Child",    residents.Count(r => r.SubCatStreetChild)),
            new("Child w/ HIV",    residents.Count(r => r.SubCatChildWithHiv)),
        }
        .Where(c => c.Count > 0)
        .OrderByDescending(c => c.Count)
        .ToList();

        // ── Average health score (0–5) ────────────────────────────────────────
        var allHealthScores = residents
            .SelectMany(r => r.HealthRecords)
            .Select(h => AvgHealthScore(h.GeneralHealthScore, h.NutritionScore,
                                        h.SleepQualityScore, h.EnergyLevelScore))
            .OfType<double>().ToList();
        var globalAvgHealth = allHealthScores.Count > 0
            ? Math.Round(allHealthScores.Average(), 2) : 0;

        // ── Average education progress (%) ────────────────────────────────────
        var allEduProgress = residents
            .SelectMany(r => r.EducationRecords)
            .Where(e => e.ProgressPercent.HasValue)
            .Select(e => NormalizePercent((double)e.ProgressPercent!.Value))
            .ToList();
        var globalAvgEdu = allEduProgress.Count > 0
            ? Math.Round(allEduProgress.Average(), 1) : 0;

        // ── Reintegration success rate ────────────────────────────────────────
        var withReinteg = residents.Count(r => !string.IsNullOrWhiteSpace(r.ReintegrationStatus));
        var completed   = residents.Count(r => r.ReintegrationStatus == "Completed");
        var successRate = withReinteg > 0
            ? Math.Round((double)completed / withReinteg * 100, 1) : 0;

        // ── Donation trend (last 12 calendar months) ──────────────────────────
        var donationTrend = Enumerable.Range(0, 12)
            .Select(i =>
            {
                var mo    = startOfMonth.AddMonths(-(11 - i));
                var total = donations
                    .Where(d => d.DonationDate.Year == mo.Year
                             && d.DonationDate.Month == mo.Month
                             && (d.Amount.HasValue || d.EstimatedValue.HasValue))
                    .Sum(d => (double)(d.Amount ?? d.EstimatedValue ?? 0));
                return new DonationTrendPoint(mo.ToString("MMM yyyy"), Math.Round(total, 2));
            })
            .ToList();

        // ── Per-safehouse aggregations (use SafehouseCode, not Name) ──────────
        var safehouseOutcomes    = new List<SafehouseOutcomePoint>();
        var safehousePerformance = new List<SafehousePerformanceRow>();
        var incidentResidentIds  = incidentsThisMonth.Select(i => i.ResidentId).ToHashSet();

        foreach (var sh in safehouses)
        {
            var shResidents = residents.Where(r => r.SafehouseId == sh.SafehouseId).ToList();
            var activeCount = shResidents.Count(r =>
                r.CaseStatus == "Active" || r.CaseStatus == "Reintegrating");

            var shHealthRaw = shResidents
                .SelectMany(r => r.HealthRecords)
                .Select(h => AvgHealthScore(h.GeneralHealthScore, h.NutritionScore,
                                            h.SleepQualityScore, h.EnergyLevelScore))
                .OfType<double>().ToList();
            var shHealth100 = shHealthRaw.Count > 0
                ? Math.Round(shHealthRaw.Average() * 20, 1) : 0;   // 0–5 → 0–100

            var shEduRaw = shResidents
                .SelectMany(r => r.EducationRecords)
                .Where(e => e.ProgressPercent.HasValue)
                .Select(e => NormalizePercent((double)e.ProgressPercent!.Value))
                .ToList();
            var shEdu = shEduRaw.Count > 0
                ? Math.Round(shEduRaw.Average(), 1) : 0;

            var shResidentIds = shResidents.Select(r => r.ResidentId).ToHashSet();
            var shIncidents   = incidentResidentIds.Count(rid => shResidentIds.Contains(rid));

            // ── Use SafehouseCode as the display label, never the Name ────────
            safehouseOutcomes.Add(new SafehouseOutcomePoint(sh.SafehouseCode, shHealth100, shEdu));
            safehousePerformance.Add(new SafehousePerformanceRow(
                sh.SafehouseCode, activeCount, shHealth100, shEdu, shIncidents));
        }

        return Ok(new ReportsSummaryDto(
            totalBeneficiaries,
            activeCases,
            newAdmissionsThisYear,
            reintegratedCompleted,
            sessionCount,
            visitationCount,
            healthCount,
            educationCount,
            interventionCount,
            educationalPlans,
            byStatus,
            byRisk,
            subcategories,
            successRate,
            globalAvgHealth,
            globalAvgEdu,
            donationTrend,
            safehouseOutcomes,
            safehousePerformance
        ));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static double? AvgHealthScore(
        decimal? g, decimal? n, decimal? s, decimal? e)
    {
        var vals = new[] { g, n, s, e }
            .Where(v => v.HasValue)
            .Select(v => v!.Value > 5 ? (double)(v.Value / 2) : (double)v.Value)
            .ToList();
        return vals.Count > 0 ? vals.Average() : null;
    }

    private static double NormalizePercent(double raw) =>
        raw is >= 0 and <= 1 ? raw * 100 : raw;
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record CategoryCount(string Label, int Count);

public record ReportsSummaryDto(
    // Beneficiary summary
    int TotalBeneficiaries,
    int ActiveCases,
    int NewAdmissionsThisYear,
    int ReintegratedCompleted,

    // Services rendered
    int CounselingSessionsTotal,
    int HomeVisitationsTotal,
    int HealthAssessmentsTotal,
    int EducationRecordsTotal,
    int InterventionPlansTotal,
    int EducationalPlansTotal,

    // Case composition
    List<CategoryCount> CasesByStatus,
    List<CategoryCount> CasesByRisk,
    List<CategoryCount> SubcategoryBreakdown,

    // Outcomes
    double ReintegrationSuccessRate,
    double AvgHealthScore,          // 0–5
    double AvgEducationProgress,    // 0–100

    // Charts
    List<DonationTrendPoint>      DonationTrend,
    List<SafehouseOutcomePoint>   SafehouseOutcomes,
    List<SafehousePerformanceRow> SafehousePerformance
);

public record DonationTrendPoint(string Month, double Amount);

public record SafehouseOutcomePoint(
    string Safehouse,
    double Health,      // 0–100
    double Education    // 0–100
);

public record SafehousePerformanceRow(
    string Name,
    int    Residents,
    double HealthScore,        // 0–100
    double EducationProgress,  // 0–100
    int    Incidents
);
