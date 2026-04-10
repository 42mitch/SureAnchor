using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/intervention-plans")]
[Authorize(Roles = "Admin,Staff")]
public class InterventionPlansController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public InterventionPlansController(ApplicationDbContext db) => _db = db;

    // ── GET /api/intervention-plans/upcoming-conferences ──────────────────────
    [HttpGet("upcoming-conferences")]
    public async Task<IActionResult> GetUpcomingConferences()
    {
        // Show conferences that have a scheduled date and are not yet completed/closed
        // This includes both future conferences and recent past conferences that are still active
        var conferences = await _db.InterventionPlans
            .Include(p => p.Resident)
            .Where(p => p.CaseConferenceDate.HasValue
                     && p.Status != "Achieved"
                     && p.Status != "Closed")
            .OrderBy(p => p.CaseConferenceDate)
            .Take(10)
            .Select(p => new UpcomingConferenceDto(
                p.PlanId,
                p.ResidentId,
                p.Resident.InternalCode,
                p.PlanCategory,
                p.PlanDescription,
                p.CaseConferenceDate!.Value.ToString("yyyy-MM-dd"),
                p.Status
            ))
            .ToListAsync();

        return Ok(conferences);
    }

    // ── GET /api/intervention-plans?residentId={id} ───────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? residentId)
    {
        var query = _db.InterventionPlans.AsQueryable();
        if (residentId.HasValue)
            query = query.Where(p => p.ResidentId == residentId.Value);

        var list = await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new InterventionPlanDto(
                p.PlanId,
                p.ResidentId,
                p.PlanCategory,
                p.PlanDescription,
                p.ServicesProvided,
                p.TargetValue,
                p.TargetDate.HasValue ? p.TargetDate.Value.ToString("yyyy-MM-dd") : null,
                p.Status,
                p.CaseConferenceDate.HasValue ? p.CaseConferenceDate.Value.ToString("yyyy-MM-dd") : null,
                p.CreatedAt.ToString("yyyy-MM-dd"),
                p.UpdatedAt.ToString("yyyy-MM-dd")
            ))
            .ToListAsync();

        return Ok(list);
    }

    // ── POST /api/intervention-plans ──────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] InterventionPlanWriteDto dto)
    {
        var now = DateTime.UtcNow;
        var plan = new InterventionPlan
        {
            PlanId             = (_db.InterventionPlans.Any() ? _db.InterventionPlans.Max(p => p.PlanId) : 0) + 1,
            ResidentId         = dto.ResidentId,
            PlanCategory       = dto.PlanCategory,
            PlanDescription    = dto.PlanDescription,
            ServicesProvided   = dto.ServicesProvided,
            TargetValue        = dto.TargetValue,
            TargetDate         = dto.TargetDate != null ? DateOnly.Parse(dto.TargetDate) : null,
            Status             = dto.Status,
            CaseConferenceDate = dto.CaseConferenceDate != null ? DateOnly.Parse(dto.CaseConferenceDate) : null,
            CreatedAt          = now,
            UpdatedAt          = now,
        };
        _db.InterventionPlans.Add(plan);
        await _db.SaveChangesAsync();
        return Ok(new { plan.PlanId });
    }

    // ── PUT /api/intervention-plans/{id} ──────────────────────────────────────
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] InterventionPlanWriteDto dto)
    {
        var plan = await _db.InterventionPlans.FindAsync(id);
        if (plan == null) return NotFound();

        plan.PlanCategory       = dto.PlanCategory;
        plan.PlanDescription    = dto.PlanDescription;
        plan.ServicesProvided   = dto.ServicesProvided;
        plan.TargetValue        = dto.TargetValue;
        plan.TargetDate         = dto.TargetDate != null ? DateOnly.Parse(dto.TargetDate) : null;
        plan.Status             = dto.Status;
        plan.CaseConferenceDate = dto.CaseConferenceDate != null ? DateOnly.Parse(dto.CaseConferenceDate) : null;
        plan.UpdatedAt          = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── DELETE /api/intervention-plans/{id} ───────────────────────────────────
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var plan = await _db.InterventionPlans.FindAsync(id);
        if (plan == null) return NotFound();
        _db.InterventionPlans.Remove(plan);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record InterventionPlanDto(
    int      PlanId,
    int      ResidentId,
    string   PlanCategory,
    string?  PlanDescription,
    string?  ServicesProvided,
    decimal? TargetValue,
    string?  TargetDate,
    string   Status,
    string?  CaseConferenceDate,
    string   CreatedAt,
    string   UpdatedAt
);

public record InterventionPlanWriteDto(
    int      ResidentId,
    string   PlanCategory,
    string?  PlanDescription,
    string?  ServicesProvided,
    decimal? TargetValue,
    string?  TargetDate,
    string   Status,
    string?  CaseConferenceDate
);

public record UpcomingConferenceDto(
    int     PlanId,
    int     ResidentId,
    string  ResidentName,
    string  PlanCategory,
    string? PlanDescription,
    string  CaseConferenceDate,
    string  Status
);
