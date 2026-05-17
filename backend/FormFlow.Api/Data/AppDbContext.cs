using FormFlow.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormFlow.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Form> Forms => Set<Form>();
    public DbSet<FormField> FormFields => Set<FormField>();
    public DbSet<FormResponse> FormResponses => Set<FormResponse>();
    public DbSet<FieldAnswer> FieldAnswers => Set<FieldAnswer>();
    public DbSet<QrToken> QrTokens => Set<QrToken>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<FieldDropoff> FieldDropoffs => Set<FieldDropoff>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.HasMany(u => u.Forms).WithOne(f => f.User).HasForeignKey(f => f.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(u => u.RefreshTokens).WithOne(r => r.User).HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Form>(e =>
        {
            e.HasIndex(f => f.Slug).IsUnique();
            e.HasIndex(f => f.UserId);
            e.Property(f => f.AllowedEmails).HasColumnType("text[]");
            e.Property(f => f.EnabledLanguages).HasColumnType("text[]");
            e.Property(f => f.Translations).HasColumnType("jsonb");
            e.HasMany(f => f.Fields).WithOne(ff => ff.Form).HasForeignKey(ff => ff.FormId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(f => f.Responses).WithOne(r => r.Form).HasForeignKey(r => r.FormId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(f => f.QrTokens).WithOne(q => q.Form).HasForeignKey(q => q.FormId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(f => f.ForkedFrom).WithMany().HasForeignKey(f => f.ForkedFromId).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(f => f.FieldDropoffs).WithOne(d => d.Form).HasForeignKey(d => d.FormId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FormField>(e =>
        {
            e.HasIndex(ff => new { ff.FormId, ff.SortOrder });
            e.Property(ff => ff.Options).HasColumnType("jsonb");
            e.Property(ff => ff.Validation).HasColumnType("jsonb");
            e.Property(ff => ff.Conditional).HasColumnType("jsonb");
            e.Property(ff => ff.Translations).HasColumnType("jsonb");
            e.HasMany(ff => ff.Answers).WithOne(a => a.Field).HasForeignKey(a => a.FieldId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FieldDropoff>(e =>
        {
            e.HasIndex(d => new { d.FormId, d.FieldId });
        });

        modelBuilder.Entity<FormResponse>(e =>
        {
            e.HasIndex(r => new { r.FormId, r.SubmittedAt });
            e.HasMany(r => r.Answers).WithOne(a => a.Response).HasForeignKey(a => a.ResponseId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FieldAnswer>(e =>
        {
            e.HasIndex(a => a.ResponseId);
            e.HasIndex(a => a.FieldId);
            e.Property(a => a.ValuesArray).HasColumnType("text[]");
        });

        modelBuilder.Entity<QrToken>(e =>
        {
            e.HasIndex(q => q.Token).IsUnique();
            e.HasIndex(q => q.FormId);
        });

        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.HasIndex(r => r.UserId);
        });
    }
}
