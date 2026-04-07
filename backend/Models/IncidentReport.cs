using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("incident_reports")]
public class IncidentReport
{
    [Key]
    public int IncidentId { get; set; }
    public int ResidentId { get; set; }
    public int SafehouseId { get; set; }
    public DateOnly IncidentDate { get; set; }
    public string IncidentType { get; set; } = null!;
    public string Severity { get; set; } = null!;
    public string? Description { get; set; }
    public string? ResponseTaken { get; set; }
    public bool Resolved { get; set; }
    public DateOnly? ResolutionDate { get; set; }
    public string? ReportedBy { get; set; }
    public bool FollowUpRequired { get; set; }

    public Resident Resident { get; set; } = null!;
    public Safehouse Safehouse { get; set; } = null!;
}
