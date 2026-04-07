using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/incident-reports")]
[Authorize(Roles = "Admin,Staff")]
public class IncidentReportsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public IncidentReportsController(ApplicationDbContext db) => _db = db;

    // ── GET /api/incident-reports ─────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? residentId, [FromQuery] bool? resolved)
    {
        var query = _db.IncidentReports.Include(i => i.Resident).AsQueryable();

        if (residentId.HasValue)
            query = query.Where(i => i.ResidentId == residentId.Value);

        if (resolved.HasValue)
            query = query.Where(i => i.Resolved == resolved.Value);

        var list = await query
            .OrderByDescending(i => i.IncidentDate)
            .Select(i => new IncidentReportDto(
                i.IncidentId,
                i.ResidentId,
                i.Resident.InternalCode,
                i.IncidentDate.ToString("yyyy-MM-dd"),
                i.IncidentType,
                i.Severity,
                i.Description ?? string.Empty,
                i.ResponseTaken ?? string.Empty,
                i.ReportedBy ?? string.Empty,
                i.Resolved,
                i.ResolutionDate.HasValue ? i.ResolutionDate.Value.ToString("yyyy-MM-dd") : null,
                i.FollowUpRequired
            ))
            .ToListAsync();

        return Ok(list);
    }

    // ── PATCH /api/incident-reports/{id}/resolve ──────────────────────────────
    [HttpPatch("{id:int}/resolve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Resolve(int id)
    {
        var report = await _db.IncidentReports.FindAsync(id);
        if (report == null) return NotFound();

        report.Resolved = true;
        report.ResolutionDate = DateOnly.FromDateTime(DateTime.UtcNow);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record IncidentReportDto(
    int IncidentId,
    int ResidentId,
    string ResidentCode,
    string IncidentDate,
    string IncidentType,
    string Severity,
    string Description,
    string ResponseTaken,
    string ReportedBy,
    bool Resolved,
    string? ResolutionDate,
    bool FollowUpRequired
);
