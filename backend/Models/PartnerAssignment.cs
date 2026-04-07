using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("partner_assignments")]
public class PartnerAssignment
{
    [Key]
    public int AssignmentId { get; set; }
    public int PartnerId { get; set; }
    public int? SafehouseId { get; set; }
    public string ProgramArea { get; set; } = null!;
    public DateOnly AssignmentStart { get; set; }
    public DateOnly? AssignmentEnd { get; set; }
    public string? ResponsibilityNotes { get; set; }
    public bool IsPrimary { get; set; }
    public string Status { get; set; } = null!;

    public Partner Partner { get; set; } = null!;
    public Safehouse? Safehouse { get; set; }
}
