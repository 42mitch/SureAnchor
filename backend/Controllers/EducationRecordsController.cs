using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/education-records")]
[Authorize(Roles = "Admin,Staff")]
public class EducationRecordsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public EducationRecordsController(ApplicationDbContext db) => _db = db;

    // ── GET /api/education-records?residentId={id} ────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? residentId)
    {
        var query = _db.EducationRecords.AsQueryable();

        if (residentId.HasValue)
            query = query.Where(e => e.ResidentId == residentId.Value);

        var list = await query
            .OrderByDescending(e => e.RecordDate)
            .Select(e => new EducationRecordDto(
                e.EducationRecordId,
                e.ResidentId,
                e.RecordDate.ToString("yyyy-MM-dd"),
                e.EducationLevel ?? string.Empty,
                e.SchoolName ?? string.Empty,
                e.EnrollmentStatus ?? string.Empty,
                e.AttendanceRate.HasValue ? (double)e.AttendanceRate.Value : null,
                e.ProgressPercent.HasValue ? (double)e.ProgressPercent.Value : null,
                e.CompletionStatus ?? string.Empty,
                e.Notes ?? string.Empty
            ))
            .ToListAsync();

        return Ok(list);
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record EducationRecordDto(
    int EducationRecordId,
    int ResidentId,
    string RecordDate,
    string EducationLevel,
    string SchoolName,
    string EnrollmentStatus,
    double? AttendanceRate,
    double? ProgressPercent,
    string CompletionStatus,
    string Notes
);
