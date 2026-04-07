using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("process_recordings")]
public class ProcessRecording
{
    [Key]
    public int RecordingId { get; set; }
    public int ResidentId { get; set; }
    public DateOnly SessionDate { get; set; }
    public string SocialWorker { get; set; } = null!;
    public string SessionType { get; set; } = null!;
    public int? SessionDurationMinutes { get; set; }
    public string? EmotionalStateObserved { get; set; }
    public string? EmotionalStateEnd { get; set; }
    public string? SessionNarrative { get; set; }
    public string? InterventionsApplied { get; set; }
    public string? FollowUpActions { get; set; }
    public bool ProgressNoted { get; set; }
    public bool ConcernsFlagged { get; set; }
    public bool ReferralMade { get; set; }
    public string? NotesRestricted { get; set; }

    public Resident Resident { get; set; } = null!;
}
