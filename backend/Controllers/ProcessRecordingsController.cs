using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/process-recordings")]
[Authorize(Roles = "Admin,Staff")]
public class ProcessRecordingsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public ProcessRecordingsController(ApplicationDbContext db) => _db = db;

    // ── GET /api/process-recordings ───────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? residentId)
    {
        var query = _db.ProcessRecordings.Include(p => p.Resident).AsQueryable();
        if (residentId.HasValue)
            query = query.Where(p => p.ResidentId == residentId.Value);

        var list = await query
            .OrderByDescending(p => p.SessionDate)
            .Select(p => new ProcessRecordingDto(
                p.RecordingId,
                p.ResidentId,
                p.Resident.InternalCode,
                p.SessionDate.ToString("yyyy-MM-dd"),
                p.SocialWorker,
                p.SessionType,
                p.EmotionalStateObserved ?? string.Empty,
                p.SessionNarrative ?? string.Empty,
                p.InterventionsApplied ?? string.Empty,
                p.FollowUpActions ?? string.Empty,
                p.ProgressNoted,
                p.ConcernsFlagged
            ))
            .ToListAsync();
        return Ok(list);
    }

    // ── POST /api/process-recordings ──────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProcessRecordingWriteDto dto)
    {
        var rec = new ProcessRecording
        {
            ResidentId = dto.ResidentId,
            SessionDate = DateOnly.Parse(dto.SessionDate),
            SocialWorker = dto.SocialWorker,
            SessionType = dto.SessionType,
            EmotionalStateObserved = dto.EmotionalStateObserved,
            SessionNarrative = dto.SessionNarrative,
            InterventionsApplied = dto.InterventionsApplied,
            FollowUpActions = dto.FollowUpActions,
            ProgressNoted = dto.ProgressNoted,
            ConcernsFlagged = dto.ConcernsFlagged,
        };
        _db.ProcessRecordings.Add(rec);
        await _db.SaveChangesAsync();
        return Ok(new { rec.RecordingId });
    }

    // ── PUT /api/process-recordings/{id} ──────────────────────────────────────
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ProcessRecordingWriteDto dto)
    {
        var rec = await _db.ProcessRecordings.FindAsync(id);
        if (rec == null) return NotFound();

        rec.ResidentId = dto.ResidentId;
        rec.SessionDate = DateOnly.Parse(dto.SessionDate);
        rec.SocialWorker = dto.SocialWorker;
        rec.SessionType = dto.SessionType;
        rec.EmotionalStateObserved = dto.EmotionalStateObserved;
        rec.SessionNarrative = dto.SessionNarrative;
        rec.InterventionsApplied = dto.InterventionsApplied;
        rec.FollowUpActions = dto.FollowUpActions;
        rec.ProgressNoted = dto.ProgressNoted;
        rec.ConcernsFlagged = dto.ConcernsFlagged;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── DELETE /api/process-recordings/{id} ───────────────────────────────────
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var rec = await _db.ProcessRecordings.FindAsync(id);
        if (rec == null) return NotFound();
        _db.ProcessRecordings.Remove(rec);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record ProcessRecordingDto(
    int RecordingId,
    int ResidentId,
    string ResidentCode,
    string SessionDate,
    string SocialWorker,
    string SessionType,
    string EmotionalState,
    string Narrative,
    string Interventions,
    string FollowUp,
    bool ProgressNoted,
    bool ConcernsFlagged
);

public record ProcessRecordingWriteDto(
    int ResidentId,
    string SessionDate,
    string SocialWorker,
    string SessionType,
    string? EmotionalStateObserved,
    string? SessionNarrative,
    string? InterventionsApplied,
    string? FollowUpActions,
    bool ProgressNoted,
    bool ConcernsFlagged
);
