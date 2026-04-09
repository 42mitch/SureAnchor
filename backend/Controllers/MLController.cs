using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Backend.Controllers;

/// <summary>
/// Proxy controller: pulls live data from the database, engineers features,
/// then forwards prediction requests to the Python ML microservice.
/// All endpoints gracefully return { available: false } if the ML service
/// is unreachable rather than throwing a 500.
/// </summary>
[ApiController]
[Route("api/ml")]
[Authorize(Roles = "Admin,Staff")]
public class MLController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;

    public MLController(ApplicationDbContext db, IHttpClientFactory http, IConfiguration config)
    {
        _db = db;
        _http = http;
        _config = config;
    }

    private string MlServiceUrl =>
        _config["MlService:BaseUrl"] ?? "http://localhost:8000";

    private async Task<T?> PostToMl<T>(string path, object body)
    {
        try
        {
            var client = _http.CreateClient("ml");
            var response = await client.PostAsJsonAsync($"{MlServiceUrl}{path}", body);
            if (!response.IsSuccessStatusCode) return default;
            return await response.Content.ReadFromJsonAsync<T>();
        }
        catch
        {
            return default;
        }
    }

    // =========================================================================
    // Health trajectory for a single resident
    // GET /api/ml/residents/{id}/health-trajectory
    // =========================================================================
    [HttpGet("residents/{id:int}/health-trajectory")]
    public async Task<IActionResult> GetHealthTrajectory(int id)
    {
        var today = DateTime.UtcNow;
        var now = DateOnly.FromDateTime(today);
        var ago30  = DateOnly.FromDateTime(today.AddDays(-30));
        var ago60  = DateOnly.FromDateTime(today.AddDays(-60));
        var ago90  = DateOnly.FromDateTime(today.AddDays(-90));

        var resident = await _db.Residents.FindAsync(id);
        if (resident == null) return NotFound();

        // ── Health records ──────────────────────────────────────────────────
        var healthRecords = await _db.HealthWellbeingRecords
            .Where(h => h.ResidentId == id)
            .OrderBy(h => h.RecordDate)
            .ToListAsync();

        var sessions = await _db.ProcessRecordings
            .Where(s => s.ResidentId == id)
            .ToListAsync();

        var incidents = await _db.IncidentReports
            .Where(i => i.ResidentId == id)
            .ToListAsync();

        var plans = await _db.InterventionPlans
            .Where(p => p.ResidentId == id)
            .ToListAsync();

        // Latest health record scores
        var latest = healthRecords.LastOrDefault();
        double genHealth = (double)(latest?.GeneralHealthScore ?? 3);
        double nutrition = (double)(latest?.NutritionScore ?? 3);
        double sleep     = (double)(latest?.SleepQualityScore ?? 3);
        double energy    = (double)(latest?.EnergyLevelScore ?? 3);
        double bmi       = (double)(latest?.Bmi ?? 22);

        // Lag features from prior health records
        double lag1Health = healthRecords.Count >= 2
            ? (double)(healthRecords[^2].GeneralHealthScore ?? (decimal)genHealth)
            : genHealth;
        double lag2Health = healthRecords.Count >= 3
            ? (double)(healthRecords[^3].GeneralHealthScore ?? (decimal)lag1Health)
            : lag1Health;

        // 3-month trend (linear slope via simple differencing)
        var last3Health = healthRecords.TakeLast(3).Select(h => (double)(h.GeneralHealthScore ?? 3)).ToList();
        double healthTrend3Mo = last3Health.Count >= 2 ? last3Health.Last() - last3Health.First() : 0;

        var last3Nutrition = healthRecords.TakeLast(3).Select(h => (double)(h.NutritionScore ?? 3)).ToList();
        double nutritionTrend3Mo = last3Nutrition.Count >= 2 ? last3Nutrition.Last() - last3Nutrition.First() : 0;

        // 2-month rolling average
        var last2Health = healthRecords.TakeLast(2).Select(h => (double)(h.GeneralHealthScore ?? 3)).ToList();
        double rollingAvg2Mo = last2Health.Count > 0 ? last2Health.Average() : genHealth;

        // Session features (last 30 days)
        var recentSessions = sessions.Where(s => s.SessionDate >= ago30).ToList();
        int sessionsLast30 = recentSessions.Count;
        double avgSessionDuration = sessionsLast30 > 0
            ? recentSessions.Average(s => (double)(s.SessionDurationMinutes ?? 60))
            : 0;
        double pctProgress = sessions.Count > 0
            ? sessions.Count(s => s.ProgressNoted) / (double)sessions.Count
            : 0;
        double pctConcerns = sessions.Count > 0
            ? sessions.Count(s => s.ConcernsFlagged) / (double)sessions.Count
            : 0;

        // Emotional improvement rate (positive end state vs negative start state)
        var positiveEnd = new HashSet<string> { "Hopeful", "Calm", "Reflective" };
        var negativeStart = new HashSet<string> { "Anxious", "Distressed", "Withdrawn" };
        var improvable = sessions.Where(s =>
            !string.IsNullOrEmpty(s.EmotionalStateObserved) &&
            negativeStart.Contains(s.EmotionalStateObserved) &&
            !string.IsNullOrEmpty(s.EmotionalStateEnd)).ToList();
        double emotionalImprovementRate = improvable.Count > 0
            ? improvable.Count(s => positiveEnd.Contains(s.EmotionalStateEnd!)) / (double)improvable.Count
            : 0;

        // Incident features (last 60 days)
        var recentIncidents = incidents.Where(i => i.IncidentDate >= ago60).ToList();
        int incidentsLast60 = recentIncidents.Count;
        int highSeverityLast60 = recentIncidents.Count(i => i.Severity == "High" || i.Severity == "Critical");
        double pctResolved = incidents.Count > 0
            ? incidents.Count(i => i.Resolved) / (double)incidents.Count
            : 1.0;
        int hasSelfHarm  = incidents.Any(i => i.IncidentType?.Contains("Self") == true) ? 1 : 0;
        int hasMedical   = incidents.Any(i => i.IncidentType?.Contains("Medical") == true) ? 1 : 0;

        // Plan features
        int activePlans = plans.Count(p => p.Status == "In Progress" || p.Status == "Pending");
        var completedPlans = plans.Count(p => p.Status == "Completed");
        double pctPlansAchieved = plans.Count > 0 ? completedPlans / (double)plans.Count : 0;
        int hasPhysicalPlan = plans.Any(p => p.PlanCategory == "Health") ? 1 : 0;
        int hasPsychoPlan   = plans.Any(p => p.PlanCategory == "Psychosocial") ? 1 : 0;

        // Risk ordinals
        static int RiskOrd(string? r) => r switch {
            "Low" => 0, "Medium" => 1, "High" => 2, "Critical" => 3, _ => 1
        };

        // Length of stay in months
        double losMonths = resident.DateOfAdmission.HasValue
            ? (now.DayNumber - resident.DateOfAdmission.Value.DayNumber) / 30.44
            : 6;

        // Checkups from latest record
        int medCheckup  = (latest?.MedicalCheckupDone == true) ? 1 : 0;
        int denCheckup  = (latest?.DentalCheckupDone == true) ? 1 : 0;
        int psyCheckup  = (latest?.PsychologicalCheckupDone == true) ? 1 : 0;

        var payload = new
        {
            general_health_score = genHealth,
            nutrition_score = nutrition,
            sleep_score = sleep,
            energy_score = energy,
            bmi = bmi,
            health_score_lag1 = lag1Health,
            health_score_lag2 = lag2Health,
            health_trend_3mo = healthTrend3Mo,
            nutrition_trend_3mo = nutritionTrend3Mo,
            rolling_avg_health_2mo = rollingAvg2Mo,
            sessions_last_30_days = sessionsLast30,
            avg_session_duration_last_30_days = avgSessionDuration,
            pct_sessions_progress_noted = pctProgress,
            pct_sessions_concerns_flagged = pctConcerns,
            emotional_improvement_rate = emotionalImprovementRate,
            incidents_last_60_days = incidentsLast60,
            high_severity_incidents_last_60_days = highSeverityLast60,
            pct_incidents_resolved = pctResolved,
            active_plans_count = activePlans,
            pct_plans_achieved_to_date = pctPlansAchieved,
            initial_risk_level_ord = RiskOrd(resident.InitialRiskLevel),
            current_risk_level_ord = RiskOrd(resident.CurrentRiskLevel),
            length_of_stay_months = losMonths,
            medical_checkup_done = medCheckup,
            dental_checkup_done = denCheckup,
            psychological_checkup_done = psyCheckup,
            has_selfharm_incident = hasSelfHarm,
            has_medical_incident = hasMedical,
            has_physical_health_plan = hasPhysicalPlan,
            has_psychosocial_plan = hasPsychoPlan,
            is_pwd = resident.IsPwd ? 1 : 0,
            has_special_needs = resident.HasSpecialNeeds ? 1 : 0,
            sub_cat_trafficked = resident.SubCatTrafficked ? 1 : 0,
            sub_cat_sexual_abuse = resident.SubCatSexualAbuse ? 1 : 0,
            sub_cat_physical_abuse = resident.SubCatPhysicalAbuse ? 1 : 0,
            family_is_4ps = resident.FamilyIs4Ps ? 1 : 0,
            family_solo_parent = resident.FamilySoloParent ? 1 : 0,
        };

        var result = await PostToMl<JsonElement?>("/predict/health-trajectory", payload);
        if (result == null)
            return Ok(new { available = false, reason = "ML service unavailable" });

        return Ok(result);
    }

    // =========================================================================
    // Reintegration readiness for a single resident
    // GET /api/ml/residents/{id}/reintegration
    // =========================================================================
    [HttpGet("residents/{id:int}/reintegration")]
    public async Task<IActionResult> GetReintegration(int id)
    {
        var resident = await _db.Residents.FindAsync(id);
        if (resident == null) return NotFound();

        var sessions   = await _db.ProcessRecordings.Where(s => s.ResidentId == id).ToListAsync();
        var incidents  = await _db.IncidentReports.Where(i => i.ResidentId == id).ToListAsync();
        var plans      = await _db.InterventionPlans.Where(p => p.ResidentId == id).ToListAsync();
        var visits     = await _db.HomeVisitations.Where(v => v.ResidentId == id).ToListAsync();
        var eduRecords = await _db.EducationRecords.Where(e => e.ResidentId == id).ToListAsync();
        var healthRecs = await _db.HealthWellbeingRecords.Where(h => h.ResidentId == id).ToListAsync();

        // Session aggregates
        int totalSessions = sessions.Count;
        double avgSessionDuration = totalSessions > 0
            ? sessions.Average(s => (double)(s.SessionDurationMinutes ?? 60)) : 0;
        double pctProgress  = totalSessions > 0 ? sessions.Count(s => s.ProgressNoted) / (double)totalSessions : 0;
        double pctConcerns  = totalSessions > 0 ? sessions.Count(s => s.ConcernsFlagged) / (double)totalSessions : 0;
        double pctReferral  = totalSessions > 0 ? sessions.Count(s => s.ReferralMade) / (double)totalSessions : 0;

        var positiveEnd  = new HashSet<string> { "Hopeful", "Calm", "Reflective" };
        var negativeStart = new HashSet<string> { "Anxious", "Distressed", "Withdrawn" };
        var improvable = sessions.Where(s =>
            !string.IsNullOrEmpty(s.EmotionalStateObserved) &&
            negativeStart.Contains(s.EmotionalStateObserved) &&
            !string.IsNullOrEmpty(s.EmotionalStateEnd)).ToList();
        double emotionalImprovementRate = improvable.Count > 0
            ? improvable.Count(s => positiveEnd.Contains(s.EmotionalStateEnd!)) / (double)improvable.Count : 0;

        // Education aggregates
        double avgAttendance = eduRecords.Count > 0
            ? eduRecords.Where(e => e.AttendanceRate.HasValue)
                .Select(e => (double)e.AttendanceRate!.Value)
                .DefaultIfEmpty(0).Average() : 0;
        if (avgAttendance <= 1.0) avgAttendance *= 100; // normalise ratio → percent
        double avgProgress = eduRecords.Count > 0
            ? eduRecords.Where(e => e.ProgressPercent.HasValue)
                .Select(e => (double)e.ProgressPercent!.Value)
                .DefaultIfEmpty(0).Average() : 0;
        if (avgProgress <= 1.0) avgProgress *= 100;

        // Health aggregates
        double avgGenHealth  = healthRecs.Count > 0 ? healthRecs.Where(h => h.GeneralHealthScore.HasValue).Select(h => (double)h.GeneralHealthScore!.Value).DefaultIfEmpty(3).Average() : 3;
        double avgNutrition  = healthRecs.Count > 0 ? healthRecs.Where(h => h.NutritionScore.HasValue).Select(h => (double)h.NutritionScore!.Value).DefaultIfEmpty(3).Average() : 3;
        double avgSleep      = healthRecs.Count > 0 ? healthRecs.Where(h => h.SleepQualityScore.HasValue).Select(h => (double)h.SleepQualityScore!.Value).DefaultIfEmpty(3).Average() : 3;
        double avgEnergy     = healthRecs.Count > 0 ? healthRecs.Where(h => h.EnergyLevelScore.HasValue).Select(h => (double)h.EnergyLevelScore!.Value).DefaultIfEmpty(3).Average() : 3;
        double avgBmi        = healthRecs.Count > 0 ? healthRecs.Where(h => h.Bmi.HasValue).Select(h => (double)h.Bmi!.Value).DefaultIfEmpty(22).Average() : 22;
        double pctMedCheckup = healthRecs.Count > 0 ? healthRecs.Count(h => h.MedicalCheckupDone) / (double)healthRecs.Count : 0;

        // Health trend (last 3 records)
        var last3Health = healthRecs.OrderBy(h => h.RecordDate).TakeLast(3)
            .Select(h => (double)(h.GeneralHealthScore ?? 3)).ToList();
        double healthTrend = last3Health.Count >= 2 ? last3Health.Last() - last3Health.First() : 0;

        // Incident aggregates
        int totalIncidents = incidents.Count;
        int highSeverity   = incidents.Count(i => i.Severity == "High" || i.Severity == "Critical");
        double pctResolved = totalIncidents > 0 ? incidents.Count(i => i.Resolved) / (double)totalIncidents : 1;

        // Home visitation aggregates
        int totalVisits = visits.Count;
        double pctFavorable = totalVisits > 0
            ? visits.Count(v => v.VisitOutcome == "Favorable") / (double)totalVisits : 0;
        double pctSafety = totalVisits > 0
            ? visits.Count(v => v.SafetyConcernsNoted) / (double)totalVisits : 0;

        // Family cooperation score (text → numeric)
        static double CoopScore(string? c) => c switch {
            "Highly Cooperative" => 4, "Cooperative" => 3, "Neutral" => 2,
            "Uncooperative" => 1, _ => 2.5
        };
        double familyCoop = totalVisits > 0
            ? visits.Average(v => CoopScore(v.FamilyCooperationLevel)) : 2.5;

        // Intervention plan aggregates
        int totalPlans       = plans.Count;
        double pctAchieved   = totalPlans > 0 ? plans.Count(p => p.Status == "Completed") / (double)totalPlans : 0;
        double pctOnHold     = totalPlans > 0 ? plans.Count(p => p.Status == "On Hold") / (double)totalPlans : 0;
        var mostCommonIntv   = plans.GroupBy(p => p.PlanCategory)
                                    .OrderByDescending(g => g.Count())
                                    .Select(g => g.Key)
                                    .FirstOrDefault() ?? "Psychosocial";
        var latestCompletion = plans.OrderByDescending(p => p.UpdatedAt)
                                    .Select(p => p.Status)
                                    .FirstOrDefault() ?? "Pending";

        // Demographics
        int ageMonths = resident.DateOfAdmission.HasValue && resident.DateOfBirth.HasValue
            ? (resident.DateOfAdmission.Value.DayNumber - resident.DateOfBirth.Value.DayNumber) / 30
            : 144;
        var now = DateOnly.FromDateTime(DateTime.UtcNow);
        double losMonths = resident.DateOfAdmission.HasValue
            ? (now.DayNumber - resident.DateOfAdmission.Value.DayNumber) / 30.44 : 6;

        var payload = new
        {
            total_sessions = totalSessions,
            avg_session_duration_minutes = avgSessionDuration,
            pct_sessions_progress_noted = pctProgress,
            pct_sessions_concerns_flagged = pctConcerns,
            pct_sessions_referral_made = pctReferral,
            emotional_improvement_rate = emotionalImprovementRate,
            avg_attendance_rate = avgAttendance,
            avg_progress_percent = avgProgress,
            avg_gpa_like_score = avgProgress / 20.0, // scale 0-100 → 0-5
            avg_general_health_score = avgGenHealth,
            avg_nutrition_score = avgNutrition,
            avg_sleep_score = avgSleep,
            avg_energy_score = avgEnergy,
            avg_bmi = avgBmi,
            pct_medical_checkups_done = pctMedCheckup,
            health_trend = healthTrend,
            total_incidents = totalIncidents,
            high_severity_incidents = highSeverity,
            pct_incidents_resolved = pctResolved,
            total_visits = totalVisits,
            pct_favorable_outcomes = pctFavorable,
            pct_safety_concerns_noted = pctSafety,
            family_cooperation_score = familyCoop,
            total_plans = totalPlans,
            pct_plans_achieved = pctAchieved,
            pct_plans_on_hold = pctOnHold,
            is_pwd = resident.IsPwd ? 1 : 0,
            has_special_needs = resident.HasSpecialNeeds ? 1 : 0,
            family_is_4ps = resident.FamilyIs4Ps ? 1 : 0,
            family_solo_parent = resident.FamilySoloParent ? 1 : 0,
            family_informal_settler = resident.FamilyInformalSettler ? 1 : 0,
            sub_cat_trafficked = resident.SubCatTrafficked ? 1 : 0,
            sub_cat_physical_abuse = resident.SubCatPhysicalAbuse ? 1 : 0,
            sub_cat_sexual_abuse = resident.SubCatSexualAbuse ? 1 : 0,
            sub_cat_osaec = resident.SubCatOsaec ? 1 : 0,
            age_upon_admission_months = ageMonths,
            length_of_stay_months = losMonths,
            initial_risk_level = resident.InitialRiskLevel ?? "Medium",
            case_category = resident.CaseCategory ?? "General",
            referral_source = resident.ReferralSource ?? "Unknown",
            latest_completion_status = latestCompletion,
            most_common_intervention = mostCommonIntv,
        };

        var result = await PostToMl<JsonElement?>("/predict/reintegration", payload);
        if (result == null)
            return Ok(new { available = false, reason = "ML service unavailable" });

        return Ok(result);
    }

    // =========================================================================
    // Donor churn (all supporters)
    // GET /api/ml/donor-churn
    // =========================================================================
    [HttpGet("donor-churn")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetDonorChurn()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var supporters = await _db.Supporters
            .Include(s => s.Donations)
            .ToListAsync();

        var donorFeatures = supporters.Select(s =>
        {
            var dons = s.Donations.ToList();
            var monetary = dons.Where(d => d.Amount.HasValue).ToList();
            var lastDon = dons.OrderByDescending(d => d.DonationDate).FirstOrDefault();
            double daysSinceLast = lastDon != null
                ? (today.DayNumber - lastDon.DonationDate.DayNumber) : 9999;
            double totalValue = monetary.Sum(d => (double)d.Amount!.Value);
            int totalDons = dons.Count;
            double avgValue = totalDons > 0 && monetary.Count > 0
                ? totalValue / monetary.Count : 0;
            int isRecurring = dons.Any(d => d.IsRecurring) ? 1 : 0;
            int uniqueTypes = dons.Select(d => d.DonationType).Distinct().Count();
            double tenure = s.FirstDonationDate.HasValue
                ? (today.DayNumber - s.FirstDonationDate.Value.DayNumber) : 0;
            string mostCommonChannel = dons
                .GroupBy(d => d.ChannelSource ?? "Direct")
                .OrderByDescending(g => g.Count())
                .Select(g => g.Key).FirstOrDefault() ?? "Direct";
            string mostCommonCampaign = dons
                .GroupBy(d => d.CampaignName ?? "General")
                .OrderByDescending(g => g.Count())
                .Select(g => g.Key).FirstOrDefault() ?? "General";

            return new
            {
                supporter_id = s.SupporterId,
                display_name = s.DisplayName,
                email = s.Email,
                days_since_last_donation = daysSinceLast,
                total_donations = totalDons,
                total_monetary_value = totalValue,
                avg_donation_value = avgValue,
                is_recurring = isRecurring,
                unique_donation_types = uniqueTypes,
                tenure_days = tenure,
                most_common_channel = mostCommonChannel,
                most_common_campaign = mostCommonCampaign,
                supporter_type = s.SupporterType,
                relationship_type = s.RelationshipType ?? "Donor",
                acquisition_channel = s.AcquisitionChannel ?? "Direct",
            };
        }).ToList();

        var result = await PostToMl<JsonElement?>("/predict/donor-churn", new { donors = donorFeatures });
        if (result == null)
            return Ok(new { available = false, reason = "ML service unavailable" });

        return Ok(result);
    }

    // =========================================================================
    // Campaign effectiveness (all campaigns)
    // GET /api/ml/campaign-effectiveness
    // =========================================================================
    [HttpGet("campaign-effectiveness")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetCampaignEffectiveness()
    {
        var donations = await _db.Donations
            .Include(d => d.Supporter)
            .Where(d => d.CampaignName != null)
            .ToListAsync();
        var posts = await _db.SocialMediaPosts
            .Where(p => p.CampaignName != null)
            .ToListAsync();

        // Aggregate by campaign → month
        var grouped = donations
            .GroupBy(d => (
                Campaign: d.CampaignName!,
                Month: d.DonationDate.ToString("yyyy-MM")))
            .Select(g =>
            {
                var monthDons = g.ToList();
                var prevMonth = monthDons.First().DonationDate.AddMonths(-1).ToString("yyyy-MM");
                var prevGroup = donations
                    .Where(d => d.CampaignName == g.Key.Campaign &&
                                d.DonationDate.ToString("yyyy-MM") == prevMonth)
                    .ToList();

                double totalValue    = monthDons.Sum(d => (double)(d.Amount ?? d.EstimatedValue ?? 0));
                double prevValue     = prevGroup.Sum(d => (double)(d.Amount ?? d.EstimatedValue ?? 0));
                int recurringCount   = monthDons.Count(d => d.IsRecurring);
                double recurringRate = monthDons.Count > 0 ? recurringCount / (double)monthDons.Count : 0;
                double prevRecRate   = prevGroup.Count > 0
                    ? prevGroup.Count(d => d.IsRecurring) / (double)prevGroup.Count : 0;

                // Match social posts for this campaign-month
                var monthPosts = posts.Where(p =>
                    p.CampaignName == g.Key.Campaign &&
                    p.CreatedAt.ToString("yyyy-MM") == g.Key.Month).ToList();

                double totalReach      = monthPosts.Sum(p => (double)(p.Reach ?? 0));
                double avgEngagement   = monthPosts.Count > 0
                    ? monthPosts.Average(p => (double)(p.EngagementRate ?? 0)) : 0;
                int totalReferrals     = monthPosts.Sum(p => p.DonationReferrals ?? 0);
                double boostSpend      = monthPosts.Sum(p => (double)(p.BoostBudgetPhp ?? 0));
                double pctBoosted      = monthPosts.Count > 0
                    ? monthPosts.Count(p => p.IsBoosted) / (double)monthPosts.Count : 0;

                return new
                {
                    campaign_name  = g.Key.Campaign,
                    month_label    = g.Key.Month,
                    month_donations          = monthDons.Count,
                    month_unique_donors      = monthDons.Select(d => d.SupporterId).Distinct().Count(),
                    month_total_value_php    = totalValue,
                    month_post_count         = monthPosts.Count,
                    month_reach              = totalReach,
                    month_engagement         = avgEngagement,
                    month_referrals          = totalReferrals,
                    month_boost_spend        = boostSpend,
                    month_pct_boosted        = pctBoosted,
                    month_total_value_lag1   = prevValue,
                    month_recurring_rate_lag1 = prevRecRate,
                };
            }).ToList();

        if (!grouped.Any())
            return Ok(new { available = true, scorecard = Array.Empty<object>() });

        var result = await PostToMl<JsonElement?>("/predict/campaign-effectiveness", new { campaigns = grouped });
        if (result == null)
            return Ok(new { available = false, reason = "ML service unavailable" });

        return Ok(result);
    }

    // =========================================================================
    // Safehouse resource impact (all active safehouses)
    // GET /api/ml/safehouse-resources
    // =========================================================================
    [HttpGet("safehouse-resources")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetSafehouseResources()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var firstOfMonth = new DateOnly(today.Year, today.Month, 1);
        var prevMonth    = firstOfMonth.AddMonths(-1);

        var safehouses = await _db.Safehouses
            .Where(s => s.Status == "Active")
            .ToListAsync();

        var metrics = await _db.SafehouseMonthlyMetrics
            .OrderByDescending(m => m.MonthStart)
            .ToListAsync();

        var allocations = await _db.DonationAllocations
            .Include(a => a.Donation)
            .ToListAsync();

        var features = safehouses.Select(sh =>
        {
            var shMetrics = metrics.Where(m => m.SafehouseId == sh.SafehouseId).ToList();
            var current   = shMetrics.FirstOrDefault();
            var previous  = shMetrics.Skip(1).FirstOrDefault();

            double avgEdCurrent  = (double)(current?.AvgEducationProgress ?? 70);
            double avgHlCurrent  = (double)(current?.AvgHealthScore ?? 3);
            int incidentsCurrent = current?.IncidentCount ?? 0;
            int activeResidents  = current?.ActiveResidents ?? sh.CurrentOccupancy;

            double avgEdPrev     = previous?.AvgEducationProgress.HasValue == true
                ? (double)previous.AvgEducationProgress.Value
                : avgEdCurrent;
            double avgHlPrev     = previous?.AvgHealthScore.HasValue == true
                ? (double)previous.AvgHealthScore.Value
                : avgHlCurrent;

            // Funding from donation allocations for this safehouse's donations
            var shAllocs = allocations
                .Where(a => a.SafehouseId == sh.SafehouseId)
                .ToList();

            double fundEd   = shAllocs.Where(a => a.ProgramArea == "Educational").Sum(a => (double)a.AmountAllocated);
            double fundWell = shAllocs.Where(a => a.ProgramArea == "Health" || a.ProgramArea == "Psychosocial").Sum(a => (double)a.AmountAllocated);
            double fundOps  = shAllocs.Where(a => a.ProgramArea == "Operations" || a.ProgramArea == "Shelter").Sum(a => (double)a.AmountAllocated);
            double fundTrans = shAllocs.Where(a => a.ProgramArea == "Transport").Sum(a => (double)a.AmountAllocated);
            double fundMaint = shAllocs.Where(a => a.ProgramArea == "Maintenance").Sum(a => (double)a.AmountAllocated);
            double fundOut  = shAllocs.Where(a => a.ProgramArea == "Outreach").Sum(a => (double)a.AmountAllocated);
            double total    = fundEd + fundWell + fundOps + fundTrans + fundMaint + fundOut;
            if (total == 0) total = 1; // avoid division by zero

            double shAgeMonths = (today.DayNumber - sh.OpenDate.DayNumber) / 30.44;

            return new
            {
                safehouse_id   = sh.SafehouseId,
                safehouse_name = sh.Name,
                funding_education  = fundEd,
                funding_wellbeing  = fundWell,
                funding_operations = fundOps,
                funding_transport  = fundTrans,
                funding_maintenance= fundMaint,
                funding_outreach   = fundOut,
                funding_per_resident = activeResidents > 0 ? total / activeResidents : 0,
                pct_education  = fundEd  / total,
                pct_wellbeing  = fundWell / total,
                pct_operations = fundOps / total,
                education_funding_lag1 = fundEd,
                wellbeing_funding_lag1 = fundWell,
                total_funding_lag1 = total,
                funding_trend = 0.0,
                funding_consistency_3mo = 1.0,
                pct_monetary = 1.0,
                pct_inkind = 0.0,
                pct_time = 0.0,
                has_recurring_funding = 0,
                unique_donors_this_month = shAllocs.Select(a => a.Donation.SupporterId).Distinct().Count(),
                active_residents = activeResidents,
                occupancy_rate = sh.CapacityGirls > 0 ? activeResidents / (double)sh.CapacityGirls : 0.5,
                sessions_per_resident = 0.0,
                visits_per_resident = 0.0,
                incident_count_current = incidentsCurrent,
                avg_education_progress_current = avgEdCurrent,
                avg_health_score_current = avgHlCurrent,
                capacity_girls = sh.CapacityGirls,
                safehouse_age_months = shAgeMonths,
                status_active = 1,
                education_progress_lag1 = avgEdPrev,
                health_score_lag1 = avgHlPrev,
                incident_rate_lag1 = 0.0,
                education_trend_3mo = avgEdCurrent - avgEdPrev,
                health_trend_3mo = avgHlCurrent - avgHlPrev,
            };
        }).ToList();

        var result = await PostToMl<JsonElement?>("/predict/safehouse-resources", new { safehouses = features });
        if (result == null)
            return Ok(new { available = false, reason = "ML service unavailable" });

        return Ok(result);
    }

    // =========================================================================
    // Social media post impact prediction
    // POST /api/ml/social-media-impact
    // =========================================================================
    [HttpPost("social-media-impact")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> PredictSocialMediaImpact([FromBody] SocialPostPredictRequest req)
    {
        var result = await PostToMl<JsonElement?>("/predict/social-media-impact", req);
        if (result == null)
            return Ok(new { available = false, reason = "ML service unavailable" });

        return Ok(result);
    }
}

// DTO for social media post prediction input
public record SocialPostPredictRequest(
    string Platform,
    string PostType,
    string MediaType,
    string SentimentTone,
    string ContentTopic,
    string CallToActionType,
    string DayOfWeek,
    int PostHour,
    int IsBoosted,
    double BoostBudgetPhp,
    int NumHashtags,
    int CaptionLength,
    int Impressions,
    int Reach,
    int Likes,
    int Comments,
    int Shares,
    int Saves,
    int ClickThroughs,
    double EngagementRate,
    int FollowerCountAtPost,
    int FeaturesResidentStory,
    int HasCallToAction
);
