using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/health-records")]
[Authorize(Roles = "Admin,Staff")]
public class HealthWellbeingController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public HealthWellbeingController(ApplicationDbContext db) => _db = db;

    // ── GET /api/health-records?residentId={id} ───────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? residentId)
    {
        var query = _db.HealthWellbeingRecords.AsQueryable();
        if (residentId.HasValue)
            query = query.Where(r => r.ResidentId == residentId.Value);

        var list = await query
            .OrderByDescending(r => r.RecordDate)
            .Select(r => new HealthRecordDto(
                r.HealthRecordId,
                r.ResidentId,
                r.RecordDate.ToString("yyyy-MM-dd"),
                r.GeneralHealthScore,
                r.NutritionScore,
                r.SleepQualityScore,
                r.EnergyLevelScore,
                r.HeightCm,
                r.WeightKg,
                r.Bmi,
                r.MedicalCheckupDone,
                r.DentalCheckupDone,
                r.PsychologicalCheckupDone,
                r.Notes
            ))
            .ToListAsync();

        return Ok(list);
    }

    // ── POST /api/health-records ──────────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] HealthRecordWriteDto dto)
    {
        var record = new HealthWellbeingRecord
        {
            HealthRecordId           = (_db.HealthWellbeingRecords.Any() ? _db.HealthWellbeingRecords.Max(r => r.HealthRecordId) : 0) + 1,
            ResidentId               = dto.ResidentId,
            RecordDate               = DateOnly.Parse(dto.RecordDate),
            GeneralHealthScore       = dto.GeneralHealthScore,
            NutritionScore           = dto.NutritionScore,
            SleepQualityScore        = dto.SleepQualityScore,
            EnergyLevelScore         = dto.EnergyLevelScore,
            HeightCm                 = dto.HeightCm,
            WeightKg                 = dto.WeightKg,
            Bmi                      = dto.WeightKg.HasValue && dto.HeightCm.HasValue && dto.HeightCm > 0
                                           ? Math.Round(dto.WeightKg.Value / (decimal)Math.Pow((double)(dto.HeightCm.Value / 100), 2), 1)
                                           : dto.Bmi,
            MedicalCheckupDone       = dto.MedicalCheckupDone,
            DentalCheckupDone        = dto.DentalCheckupDone,
            PsychologicalCheckupDone = dto.PsychologicalCheckupDone,
            Notes                    = dto.Notes,
        };
        _db.HealthWellbeingRecords.Add(record);
        await _db.SaveChangesAsync();
        return Ok(new { record.HealthRecordId });
    }

    // ── PUT /api/health-records/{id} ──────────────────────────────────────────
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] HealthRecordWriteDto dto)
    {
        var record = await _db.HealthWellbeingRecords.FindAsync(id);
        if (record == null) return NotFound();

        record.ResidentId               = dto.ResidentId;
        record.RecordDate               = DateOnly.Parse(dto.RecordDate);
        record.GeneralHealthScore       = dto.GeneralHealthScore;
        record.NutritionScore           = dto.NutritionScore;
        record.SleepQualityScore        = dto.SleepQualityScore;
        record.EnergyLevelScore         = dto.EnergyLevelScore;
        record.HeightCm                 = dto.HeightCm;
        record.WeightKg                 = dto.WeightKg;
        record.Bmi                      = dto.WeightKg.HasValue && dto.HeightCm.HasValue && dto.HeightCm > 0
                                              ? Math.Round(dto.WeightKg.Value / (decimal)Math.Pow((double)(dto.HeightCm.Value / 100), 2), 1)
                                              : dto.Bmi;
        record.MedicalCheckupDone       = dto.MedicalCheckupDone;
        record.DentalCheckupDone        = dto.DentalCheckupDone;
        record.PsychologicalCheckupDone = dto.PsychologicalCheckupDone;
        record.Notes                    = dto.Notes;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── DELETE /api/health-records/{id} ──────────────────────────────────────
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var record = await _db.HealthWellbeingRecords.FindAsync(id);
        if (record == null) return NotFound();
        _db.HealthWellbeingRecords.Remove(record);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record HealthRecordDto(
    int    HealthRecordId,
    int    ResidentId,
    string RecordDate,
    decimal? GeneralHealthScore,
    decimal? NutritionScore,
    decimal? SleepQualityScore,
    decimal? EnergyLevelScore,
    decimal? HeightCm,
    decimal? WeightKg,
    decimal? Bmi,
    bool   MedicalCheckupDone,
    bool   DentalCheckupDone,
    bool   PsychologicalCheckupDone,
    string? Notes
);

public record HealthRecordWriteDto(
    int    ResidentId,
    string RecordDate,
    decimal? GeneralHealthScore,
    decimal? NutritionScore,
    decimal? SleepQualityScore,
    decimal? EnergyLevelScore,
    decimal? HeightCm,
    decimal? WeightKg,
    decimal? Bmi,
    bool   MedicalCheckupDone,
    bool   DentalCheckupDone,
    bool   PsychologicalCheckupDone,
    string? Notes
);
