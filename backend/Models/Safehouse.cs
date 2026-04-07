using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("safehouses")]
public class Safehouse
{
    public int SafehouseId { get; set; }
    public string SafehouseCode { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Region { get; set; } = null!;
    public string City { get; set; } = null!;
    public string Province { get; set; } = null!;
    public string Country { get; set; } = "Philippines";
    public DateOnly OpenDate { get; set; }
    public string Status { get; set; } = null!;
    public int CapacityGirls { get; set; }
    public int CapacityStaff { get; set; }
    public int CurrentOccupancy { get; set; }
    public string? Notes { get; set; }

    public ICollection<Resident> Residents { get; set; } = [];
    public ICollection<PartnerAssignment> PartnerAssignments { get; set; } = [];
    public ICollection<IncidentReport> IncidentReports { get; set; } = [];
    public ICollection<SafehouseMonthlyMetric> MonthlyMetrics { get; set; } = [];
    public ICollection<DonationAllocation> DonationAllocations { get; set; } = [];
}
