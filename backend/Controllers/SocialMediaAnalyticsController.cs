using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

/// <summary>
/// Returns aggregated social media analytics to power the Social Media Strategy page.
/// All computation is done in-memory after a single DB load so we avoid complex SQL.
/// </summary>
[ApiController]
[Route("api/social-analytics")]
[Authorize(Roles = "Admin")]
public class SocialMediaAnalyticsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public SocialMediaAnalyticsController(ApplicationDbContext db)
    {
        _db = db;
    }

    // GET /api/social-analytics
    [HttpGet]
    public async Task<IActionResult> GetAnalytics()
    {
        var posts = await _db.SocialMediaPosts
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        if (!posts.Any())
            return Ok(new { available = false, reason = "No social media post data available yet." });

        // ── Posting Advisor ──────────────────────────────────────────────────
        var lastPost      = posts.First();
        var daysSinceLast = (int)(DateTime.UtcNow - lastPost.CreatedAt).TotalDays;

        // Average days between consecutive posts
        var orderedDates = posts.Select(p => p.CreatedAt).OrderBy(d => d).ToList();
        double avgFrequencyDays = 7;
        if (orderedDates.Count > 1)
        {
            var gaps = orderedDates
                .Zip(orderedDates.Skip(1), (a, b) => (b - a).TotalDays)
                .ToList();
            avgFrequencyDays = Math.Round(gaps.Average());
        }

        var daysUntilRecommended = (int)avgFrequencyDays - daysSinceLast;
        var status = daysUntilRecommended < 0  ? "Overdue"
                   : daysUntilRecommended <= 2 ? "DueSoon"
                   : "OnTrack";

        // ── By Day of Week ───────────────────────────────────────────────────
        var byDay = posts
            .Where(p => p.DayOfWeek != null && p.EngagementRate.HasValue)
            .GroupBy(p => p.DayOfWeek!)
            .Select(g => new
            {
                day = g.Key,
                avgEngagementRate = Math.Round(
                    (double)g.Average(p => p.EngagementRate!.Value) * 100, 2),
                postCount = g.Count()
            })
            .OrderBy(d => DayOrder(d.day))
            .ToList();

        var bestDay = byDay
            .OrderByDescending(d => d.avgEngagementRate)
            .FirstOrDefault()?.day ?? "Tuesday";

        // ── By Time of Day ───────────────────────────────────────────────────
        var byHour = posts
            .Where(p => p.PostHour.HasValue && p.EngagementRate.HasValue)
            .GroupBy(p => GetTimeBucket(p.PostHour!.Value))
            .Select(g => new
            {
                timeBucket = g.Key.Label,
                hourRange  = g.Key.Range,
                sortOrder  = g.Key.Order,
                avgEngagementRate = Math.Round(
                    (double)g.Average(p => p.EngagementRate!.Value) * 100, 2),
                postCount = g.Count()
            })
            .OrderBy(h => h.sortOrder)
            .ToList();

        var bestTimeBucket = byHour
            .OrderByDescending(h => h.avgEngagementRate)
            .FirstOrDefault()?.timeBucket ?? "Evening";

        // ── By Platform ──────────────────────────────────────────────────────
        var byPlatform = posts
            .GroupBy(p => p.Platform)
            .Select(g => new
            {
                platform = g.Key,
                postCount = g.Count(),
                avgEngagementRate = Math.Round(
                    g.Where(p => p.EngagementRate.HasValue)
                     .Select(p => (double)p.EngagementRate!.Value)
                     .DefaultIfEmpty(0).Average() * 100, 2),
                totalReach = g.Sum(p => p.Reach ?? 0),
                totalDonationReferrals = g.Sum(p => p.DonationReferrals ?? 0),
                estimatedDonationValuePhp = g.Sum(p => p.EstimatedDonationValuePhp ?? 0),
                avgLikes  = Math.Round(g.Average(p => (double)(p.Likes  ?? 0)), 1),
                avgShares = Math.Round(g.Average(p => (double)(p.Shares ?? 0)), 1)
            })
            .OrderByDescending(p => p.totalDonationReferrals)
            .ToList();

        var bestPlatform = byPlatform.FirstOrDefault()?.platform ?? "Facebook";

        // ── By Content Type ──────────────────────────────────────────────────
        var byContentType = posts
            .Where(p => p.PostType != null)
            .GroupBy(p => p.PostType!)
            .Select(g => new
            {
                postType  = g.Key,
                postCount = g.Count(),
                avgEngagementRate = Math.Round(
                    g.Where(p => p.EngagementRate.HasValue)
                     .Select(p => (double)p.EngagementRate!.Value)
                     .DefaultIfEmpty(0).Average() * 100, 2),
                totalDonationReferrals = g.Sum(p => p.DonationReferrals ?? 0),
                donationConversionRate = Math.Round(
                    g.Count(p => (p.DonationReferrals ?? 0) > 0) * 100.0 / g.Count(), 1)
            })
            .OrderByDescending(c => c.totalDonationReferrals)
            .ToList();

        var bestPostType = byContentType.FirstOrDefault()?.postType ?? "ImpactStory";

        // ── Recent Posts ─────────────────────────────────────────────────────
        var recentPosts = posts.Take(15).Select(p => new
        {
            p.PostId,
            p.Platform,
            p.PostType,
            p.CreatedAt,
            p.DayOfWeek,
            p.PostHour,
            likes    = p.Likes    ?? 0,
            shares   = p.Shares   ?? 0,
            comments = p.Comments ?? 0,
            engagementRate = Math.Round((double)(p.EngagementRate ?? 0) * 100, 2),
            donationReferrals = p.DonationReferrals ?? 0,
            estimatedDonationValuePhp = p.EstimatedDonationValuePhp ?? 0,
            caption = p.Caption != null && p.Caption.Length > 120
                ? p.Caption[..120] + "…"
                : p.Caption ?? ""
        }).ToList();

        // ── Donation Drivers ─────────────────────────────────────────────────
        var withStory    = posts.Where(p =>  p.FeaturesResidentStory).ToList();
        var withoutStory = posts.Where(p => !p.FeaturesResidentStory).ToList();
        var withCta      = posts.Where(p =>  p.HasCallToAction).ToList();
        var withoutCta   = posts.Where(p => !p.HasCallToAction).ToList();

        // Media type breakdown for recent posts
        var byMediaType = posts
            .Where(p => p.MediaType != null && p.EngagementRate.HasValue)
            .GroupBy(p => p.MediaType!)
            .Select(g => new
            {
                mediaType = g.Key,
                postCount = g.Count(),
                avgEngagementRate = Math.Round(
                    (double)g.Average(p => p.EngagementRate!.Value) * 100, 2),
                totalDonationReferrals = g.Sum(p => p.DonationReferrals ?? 0)
            })
            .OrderByDescending(m => m.avgEngagementRate)
            .ToList();

        return Ok(new
        {
            available = true,
            postingAdvisor = new
            {
                daysSinceLastPost        = daysSinceLast,
                recommendedFrequencyDays = (int)avgFrequencyDays,
                daysUntilRecommended,
                status,
                bestDayToPost  = bestDay,
                bestTimeBucket,
                bestPostType,
                bestPlatform,
                lastPostDate = lastPost.CreatedAt
            },
            byDayOfWeek   = byDay,
            byTimeOfDay   = byHour,
            byPlatform,
            byContentType,
            byMediaType,
            recentPosts,
            donationDrivers = new
            {
                avgReferralsWithStory    = withStory.Any()
                    ? Math.Round(withStory.Average(p    => (double)(p.DonationReferrals ?? 0)), 2) : 0.0,
                avgReferralsWithoutStory = withoutStory.Any()
                    ? Math.Round(withoutStory.Average(p => (double)(p.DonationReferrals ?? 0)), 2) : 0.0,
                avgReferralsWithCta    = withCta.Any()
                    ? Math.Round(withCta.Average(p      => (double)(p.DonationReferrals ?? 0)), 2) : 0.0,
                avgReferralsWithoutCta = withoutCta.Any()
                    ? Math.Round(withoutCta.Average(p   => (double)(p.DonationReferrals ?? 0)), 2) : 0.0,
                bestPlatformForDonations = bestPlatform,
                bestPostTypeForDonations = bestPostType,
                pctPostsWithStory = posts.Count > 0
                    ? Math.Round(withStory.Count * 100.0 / posts.Count, 1) : 0.0,
                pctPostsWithCta = posts.Count > 0
                    ? Math.Round(withCta.Count * 100.0 / posts.Count, 1) : 0.0
            }
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static int DayOrder(string day) => day switch
    {
        "Monday"    => 0,
        "Tuesday"   => 1,
        "Wednesday" => 2,
        "Thursday"  => 3,
        "Friday"    => 4,
        "Saturday"  => 5,
        "Sunday"    => 6,
        _           => 7
    };

    private record TimeBucketInfo(string Label, string Range, int Order);

    private static TimeBucketInfo GetTimeBucket(int hour) => hour switch
    {
        >= 5  and < 9  => new("Early Morning",  "5–9 AM",     0),
        >= 9  and < 12 => new("Morning",        "9 AM–12 PM", 1),
        >= 12 and < 15 => new("Afternoon",      "12–3 PM",    2),
        >= 15 and < 18 => new("Late Afternoon", "3–6 PM",     3),
        >= 18 and < 21 => new("Evening",        "6–9 PM",     4),
        _              => new("Night",           "9 PM–5 AM",  5)
    };
}
