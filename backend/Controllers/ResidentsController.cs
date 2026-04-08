using Backend.Data;
using Backend.Models;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/residents")]
[Authorize(Roles = "Admin,Staff")]
public class ResidentsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public ResidentsController(ApplicationDbContext db) => _db = db;

    // ── GET /api/residents/safehouses (for admin forms — list before {id} routes) ─
    [HttpGet("safehouses")]
    public async Task<IActionResult> GetSafehouses()
    {
        var list = await _db.Safehouses
            .OrderBy(s => s.SafehouseCode)
            .Select(s => new { s.SafehouseId, s.SafehouseCode, s.Name })
            .ToListAsync();
        return Ok(list);
    }

    // ── GET /api/residents ────────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var list = await _db.Residents
            .Include(r => r.Safehouse)
            .Select(r => new ResidentListDto(
                r.ResidentId,
                r.CaseControlNo,
                r.InternalCode,
                r.Safehouse.SafehouseCode,
                r.DateOfBirth.HasValue
                    ? (today.DayNumber - r.DateOfBirth.Value.DayNumber) / 365
                    : 0,
                r.CaseCategory ?? string.Empty,
                r.CurrentRiskLevel ?? string.Empty,
                r.CaseStatus,
                r.AssignedSocialWorker ?? string.Empty,
                r.Religion,
                r.DateOfAdmission
            ))
            .ToListAsync();
        return Ok(list);
    }

    // ── GET /api/residents/{id} ───────────────────────────────────────────────
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var r = await _db.Residents
            .Include(r => r.Safehouse)
            .Include(r => r.ProcessRecordings.OrderByDescending(p => p.SessionDate).Take(1))
            .FirstOrDefaultAsync(r => r.ResidentId == id);

        if (r == null) return NotFound();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var dto = new ResidentDetailDto(
            r.ResidentId,
            r.SafehouseId,
            r.CaseControlNo,
            r.InternalCode,
            r.Safehouse.SafehouseCode,
            r.DateOfBirth.HasValue ? (today.DayNumber - r.DateOfBirth.Value.DayNumber) / 365 : 0,
            r.DateOfBirth,
            r.CaseCategory ?? string.Empty,
            r.CurrentRiskLevel ?? string.Empty,
            r.InitialRiskLevel ?? string.Empty,
            r.CaseStatus,
            r.AssignedSocialWorker ?? string.Empty,
            r.Religion,
            r.DateOfAdmission,
            r.ReintegrationType,
            r.ReintegrationStatus,
            r.IsPwd,
            r.PwdType,
            r.HasSpecialNeeds,
            r.SpecialNeedsDiagnosis,
            r.ProcessRecordings.FirstOrDefault()?.SessionNarrative
        );
        return Ok(dto);
    }

    // ── POST /api/residents ───────────────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ResidentWriteDto dto)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (dto.DateOfBirth.HasValue && dto.DateOfBirth.Value > today)
            return BadRequest(new { error = "DateOfBirth cannot be in the future." });
        if (dto.DateOfAdmission.HasValue && dto.DateOfAdmission.Value > today)
            return BadRequest(new { error = "DateOfAdmission cannot be in the future." });

        var resident = new Resident
        {
            ResidentId = (_db.Residents.Any() ? _db.Residents.Max(r => r.ResidentId) : 0) + 1,
            CaseControlNo = dto.CaseControlNo,
            InternalCode = dto.InternalCode,
            SafehouseId = dto.SafehouseId,
            CaseStatus = dto.CaseStatus,
            CaseCategory = dto.CaseCategory,
            CurrentRiskLevel = dto.CurrentRiskLevel,
            AssignedSocialWorker = dto.AssignedSocialWorker,
            Religion = dto.Religion,
            DateOfBirth = dto.DateOfBirth,
            DateOfAdmission = dto.DateOfAdmission,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Residents.Add(resident);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = resident.ResidentId }, new { resident.ResidentId });
    }

    // ── PUT /api/residents/{id} ───────────────────────────────────────────────
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] ResidentWriteDto dto)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (dto.DateOfBirth.HasValue && dto.DateOfBirth.Value > today)
            return BadRequest(new { error = "DateOfBirth cannot be in the future." });
        if (dto.DateOfAdmission.HasValue && dto.DateOfAdmission.Value > today)
            return BadRequest(new { error = "DateOfAdmission cannot be in the future." });

        var resident = await _db.Residents.FindAsync(id);
        if (resident == null) return NotFound();

        resident.CaseControlNo = dto.CaseControlNo;
        resident.InternalCode = dto.InternalCode;
        resident.SafehouseId = dto.SafehouseId;
        resident.CaseStatus = dto.CaseStatus;
        resident.CaseCategory = dto.CaseCategory;
        resident.CurrentRiskLevel = dto.CurrentRiskLevel;
        resident.AssignedSocialWorker = dto.AssignedSocialWorker;
        resident.Religion = dto.Religion;
        resident.DateOfBirth = dto.DateOfBirth;
        resident.DateOfAdmission = dto.DateOfAdmission;
        resident.ReintegrationType = dto.ReintegrationType;
        resident.ReintegrationStatus = dto.ReintegrationStatus;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── PATCH /api/residents/{id}/risk-level ─────────────────────────────────
    [HttpPatch("{id:int}/risk-level")]
    public async Task<IActionResult> UpdateRiskLevel(int id, [FromBody] RiskLevelDto dto)
    {
        var resident = await _db.Residents.FindAsync(id);
        if (resident == null) return NotFound();

        resident.CurrentRiskLevel = dto.RiskLevel;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── DELETE /api/residents/{id} ────────────────────────────────────────────
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var resident = await _db.Residents.FindAsync(id);
        if (resident == null) return NotFound();
        _db.Residents.Remove(resident);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record ResidentListDto(
    int ResidentId,
    string CaseNo,
    string InternalCode,
    string Safehouse,
    int Age,
    string Category,
    string Risk,
    string Status,
    string Worker,
    string? Religion,
    DateOnly? DateAdmitted
);

public record ResidentDetailDto(
    int ResidentId,
    int SafehouseId,
    string CaseNo,
    string InternalCode,
    string Safehouse,
    int Age,
    DateOnly? DateOfBirth,
    string Category,
    string Risk,
    string InitialRisk,
    string Status,
    string Worker,
    string? Religion,
    DateOnly? DateAdmitted,
    string? ReintegrationType,
    string? ReintegrationStatus,
    bool IsPwd,
    string? PwdType,
    bool HasSpecialNeeds,
    string? SpecialNeedsDiagnosis,
    string? RecentNote
);

public record ResidentWriteDto(
    [property: Required, StringLength(50)] string CaseControlNo,
    [property: Required, StringLength(50)] string InternalCode,
    [property: Range(1, int.MaxValue)] int SafehouseId,
    [property: Required] string CaseStatus,
    string? CaseCategory,
    string? CurrentRiskLevel,
    [property: RegularExpression(@"^[A-Za-z\s'\-]+$", ErrorMessage = "AssignedSocialWorker can only contain letters, spaces, apostrophes, or hyphens.")]
    string? AssignedSocialWorker,
    string? Religion,
    DateOnly? DateOfBirth,
    DateOnly? DateOfAdmission,
    string? ReintegrationType,
    string? ReintegrationStatus
);

public record RiskLevelDto(string? RiskLevel);
