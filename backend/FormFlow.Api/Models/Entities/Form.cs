using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace FormFlow.Api.Models.Entities;

public class Form
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }

    [Required, MaxLength(12)]
    public string Slug { get; set; } = string.Empty;

    [Required, MaxLength(300)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "draft"; // draft, active, paused, closed

    public bool IsPublic { get; set; } = true;
    public bool AllowAnonymous { get; set; } = true;
    public bool CollectEmail { get; set; } = false;
    public bool LimitOneResponse { get; set; } = false;
    public bool ShuffleFields { get; set; } = false;
    public bool ShowProgress { get; set; } = true;

    public DateTime? AcceptFrom { get; set; }
    public DateTime? AcceptUntil { get; set; }
    public string[]? AllowedEmails { get; set; }

    public string ThankYouMsg { get; set; } = "Thank you for your response!";

    public Guid? ForkedFromId { get; set; }
    public int ForkCount { get; set; } = 0;
    public int ResponseCount { get; set; } = 0;
    public int ViewCount { get; set; } = 0;

    // Translation support
    public string[] EnabledLanguages { get; set; } = [];
    public JsonDocument? Translations { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Form? ForkedFrom { get; set; }
    public ICollection<FormField> Fields { get; set; } = [];
    public ICollection<FormResponse> Responses { get; set; } = [];
    public ICollection<QrToken> QrTokens { get; set; } = [];
    public ICollection<FieldDropoff> FieldDropoffs { get; set; } = [];
}
