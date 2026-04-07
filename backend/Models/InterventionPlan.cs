using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("intervention_plans")]
public class InterventionPlan
{
    [Key]
    public int PlanId { get; set; }
    public int ResidentId { get; set; }
    public string PlanCategory { get; set; } = null!;
    public string? PlanDescription { get; set; }
    public string? ServicesProvided { get; set; }
    public decimal? TargetValue { get; set; }
    public DateOnly? TargetDate { get; set; }
    public string Status { get; set; } = null!;
    public DateOnly? CaseConferenceDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Resident Resident { get; set; } = null!;
}
