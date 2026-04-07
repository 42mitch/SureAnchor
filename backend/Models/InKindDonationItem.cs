using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("in_kind_donation_items")]
public class InKindDonationItem
{
    [Key]
    public int ItemId { get; set; }
    public int DonationId { get; set; }
    public string ItemName { get; set; } = null!;
    public string? ItemCategory { get; set; }
    public int? Quantity { get; set; }
    public string? UnitOfMeasure { get; set; }
    public decimal? EstimatedUnitValue { get; set; }
    public string? IntendedUse { get; set; }
    public string? ReceivedCondition { get; set; }

    public Donation Donation { get; set; } = null!;
}
