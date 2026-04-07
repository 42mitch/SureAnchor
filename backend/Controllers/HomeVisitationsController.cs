using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/home-visitations")]
[Authorize(Roles = "Admin,Staff")]
public class HomeVisitationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public HomeVisitationsController(ApplicationDbContext db) => _db = db;

    // ── GET /api/home-visitations ─────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? residentId)
    {
        var query = _db.HomeVisitations.Include(v => v.Resident).AsQueryable();
        if (residentId.HasValue)
            query = query.Where(v => v.ResidentId == residentId.Value);

        var list = await query
            .OrderByDescending(v => v.VisitDate)
            .Select(v => new HomeVisitationDto(
                v.VisitationId,
                v.ResidentId,
                v.Resident.InternalCode,
                v.VisitDate.ToString("yyyy-MM-dd"),
                v.SocialWorker,
                v.VisitType,
                v.FamilyCooperationLevel ?? string.Empty,
                v.SafetyConcernsNoted,
                v.FollowUpNeeded,
                v.VisitOutcome ?? string.Empty
            ))
            .ToListAsync();
        return Ok(list);
    }

    // ── GET /api/home-visitations/{id} ────────────────────────────────────────
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var v = await _db.HomeVisitations
            .Include(x => x.Resident)
            .FirstOrDefaultAsync(x => x.VisitationId == id);
        if (v == null) return NotFound();

        var dto = new HomeVisitationDetailDto(
            v.VisitationId,
            v.ResidentId,
            v.Resident.InternalCode,
            v.VisitDate.ToString("yyyy-MM-dd"),
            v.SocialWorker,
            v.VisitType,
            v.FamilyCooperationLevel,
            v.SafetyConcernsNoted,
            v.FollowUpNeeded,
            v.FollowUpNotes,
            v.VisitOutcome,
            v.Purpose,
            v.Observations,
            v.LocationVisited,
            v.FamilyMembersPresent
        );
        return Ok(dto);
    }

    // ── POST /api/home-visitations ────────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] HomeVisitationWriteDto dto)
    {
        var visit = new HomeVisitation
        {
            VisitationId = (_db.HomeVisitations.Any() ? _db.HomeVisitations.Max(v => v.VisitationId) : 0) + 1,
            ResidentId = dto.ResidentId,
            VisitDate = DateOnly.Parse(dto.VisitDate),
            SocialWorker = dto.SocialWorker,
            VisitType = dto.VisitType,
            FamilyCooperationLevel = dto.FamilyCooperationLevel,
            SafetyConcernsNoted = dto.SafetyConcernsNoted,
            FollowUpNeeded = dto.FollowUpNeeded,
            FollowUpNotes = dto.FollowUpNotes,
            VisitOutcome = dto.VisitOutcome,
            Purpose = dto.Purpose,
            Observations = dto.Observations,
            LocationVisited = dto.LocationVisited,
            FamilyMembersPresent = dto.FamilyMembersPresent,
        };
        _db.HomeVisitations.Add(visit);
        await _db.SaveChangesAsync();
        return Ok(new { visit.VisitationId });
    }

    // ── PUT /api/home-visitations/{id} ────────────────────────────────────────
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] HomeVisitationWriteDto dto)
    {
        var visit = await _db.HomeVisitations.FindAsync(id);
        if (visit == null) return NotFound();

        visit.ResidentId = dto.ResidentId;
        visit.VisitDate = DateOnly.Parse(dto.VisitDate);
        visit.SocialWorker = dto.SocialWorker;
        visit.VisitType = dto.VisitType;
        visit.FamilyCooperationLevel = dto.FamilyCooperationLevel;
        visit.SafetyConcernsNoted = dto.SafetyConcernsNoted;
        visit.FollowUpNeeded = dto.FollowUpNeeded;
        visit.FollowUpNotes = dto.FollowUpNotes;
        visit.VisitOutcome = dto.VisitOutcome;
        visit.Purpose = dto.Purpose;
        visit.Observations = dto.Observations;
        visit.LocationVisited = dto.LocationVisited;
        visit.FamilyMembersPresent = dto.FamilyMembersPresent;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── DELETE /api/home-visitations/{id} ─────────────────────────────────────
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var visit = await _db.HomeVisitations.FindAsync(id);
        if (visit == null) return NotFound();
        _db.HomeVisitations.Remove(visit);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record HomeVisitationDto(
    int VisitationId,
    int ResidentId,
    string ResidentCode,
    string VisitDate,
    string SocialWorker,
    string VisitType,
    string FamilyCooperation,
    bool SafetyConcern,
    bool FollowUpNeeded,
    string Outcome
);

public record HomeVisitationDetailDto(
    int VisitationId,
    int ResidentId,
    string ResidentCode,
    string VisitDate,
    string SocialWorker,
    string VisitType,
    string? FamilyCooperationLevel,
    bool SafetyConcernsNoted,
    bool FollowUpNeeded,
    string? FollowUpNotes,
    string? VisitOutcome,
    string? Purpose,
    string? Observations,
    string? LocationVisited,
    string? FamilyMembersPresent
);

public record HomeVisitationWriteDto(
    int ResidentId,
    string VisitDate,
    string SocialWorker,
    string VisitType,
    string? FamilyCooperationLevel,
    bool SafetyConcernsNoted,
    bool FollowUpNeeded,
    string? FollowUpNotes,
    string? VisitOutcome,
    string? Purpose,
    string? Observations,
    string? LocationVisited = null,
    string? FamilyMembersPresent = null
);
