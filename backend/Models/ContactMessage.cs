using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("contact_messages")]
public class ContactMessage
{
    public int ContactMessageId { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Topic { get; set; }
    public string Message { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsResolved { get; set; } = false;
    public DateTime? ResolvedAt { get; set; }
}