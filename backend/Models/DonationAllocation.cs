using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("donation_allocations")]
public class DonationAllocation
{
    [Key]
    public int AllocationId { get; set; }
    public int DonationId { get; set; }
    public int SafehouseId { get; set; }
    public string ProgramArea { get; set; } = null!;
    public decimal AmountAllocated { get; set; }
    public DateOnly AllocationDate { get; set; }
    public string? AllocationNotes { get; set; }

    public Donation Donation { get; set; } = null!;
    public Safehouse Safehouse { get; set; } = null!;
}
