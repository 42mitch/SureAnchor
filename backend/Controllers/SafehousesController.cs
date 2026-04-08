using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/safehouses")]
[Authorize(Roles = "Admin,Staff")]
public class SafehousesController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public SafehousesController(ApplicationDbContext db) => _db = db;

    // ── GET /api/safehouses ───────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var safehouses = await _db.Safehouses
            .OrderBy(s => s.SafehouseId)
            .Select(s => new SafehouseDto(
                s.SafehouseId,
                s.SafehouseCode,
                s.Name,
                s.Region,
                s.City,
                s.Status,
                s.CapacityGirls,
                s.CapacityStaff,
                s.CurrentOccupancy,
                s.OpenDate
            ))
            .ToListAsync();

        return Ok(safehouses);
    }
}

// ── DTO ───────────────────────────────────────────────────────────────────────

public record SafehouseDto(
    int SafehouseId,
    string SafehouseCode,
    string Name,
    string Region,
    string City,
    string Status,
    int CapacityGirls,
    int CapacityStaff,
    int CurrentOccupancy,
    DateOnly OpenDate
);