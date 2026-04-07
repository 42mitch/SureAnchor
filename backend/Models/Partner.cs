using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("partners")]
public class Partner
{
    public int PartnerId { get; set; }
    public string PartnerName { get; set; } = null!;
    public string PartnerType { get; set; } = null!;
    public string RoleType { get; set; } = null!;
    public string? ContactName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Region { get; set; }
    public string Status { get; set; } = null!;
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Notes { get; set; }

    public ICollection<PartnerAssignment> Assignments { get; set; } = [];
}
