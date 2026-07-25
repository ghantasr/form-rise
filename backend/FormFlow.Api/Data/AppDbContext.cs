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
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<OrgMember> OrgMembers => Set<OrgMember>();
    public DbSet<OrgGroup> OrgGroups => Set<OrgGroup>();
    public DbSet<GroupMember> GroupMembers => Set<GroupMember>();
    public DbSet<FormAssignment> FormAssignments => Set<FormAssignment>();
    public DbSet<OrgInvite> OrgInvites => Set<OrgInvite>();
    public DbSet<Bill> Bills => Set<Bill>();
    public DbSet<BillItem> BillItems => Set<BillItem>();
    public DbSet<BusinessProfile> BusinessProfiles => Set<BusinessProfile>();
    public DbSet<BillTemplate> BillTemplates => Set<BillTemplate>();
    public DbSet<BillTemplateItem> BillTemplateItems => Set<BillTemplateItem>();

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
            e.Property(ff => ff.QuizConfig).HasColumnType("jsonb");
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

        // Organization
        modelBuilder.Entity<Organization>(e =>
        {
            e.HasIndex(o => o.Slug).IsUnique();
            e.HasOne(o => o.Creator).WithMany().HasForeignKey(o => o.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasMany(o => o.Members).WithOne(m => m.Org).HasForeignKey(m => m.OrgId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(o => o.Groups).WithOne(g => g.Org).HasForeignKey(g => g.OrgId).OnDelete(DeleteBehavior.Cascade);
        });

        // OrgMember — unique per org+user
        modelBuilder.Entity<OrgMember>(e =>
        {
            e.HasIndex(m => new { m.OrgId, m.UserId }).IsUnique();
            e.HasOne(m => m.User).WithMany(u => u.OrgMemberships).HasForeignKey(m => m.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // OrgGroup
        modelBuilder.Entity<OrgGroup>(e =>
        {
            e.HasMany(g => g.Members).WithOne(gm => gm.Group).HasForeignKey(gm => gm.GroupId).OnDelete(DeleteBehavior.Cascade);
        });

        // GroupMember — composite PK
        modelBuilder.Entity<GroupMember>(e =>
        {
            e.HasKey(gm => new { gm.GroupId, gm.UserId });
            e.HasOne(gm => gm.User).WithMany().HasForeignKey(gm => gm.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // FormAssignment
        modelBuilder.Entity<FormAssignment>(e =>
        {
            e.HasOne(a => a.Form).WithMany().HasForeignKey(a => a.FormId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(a => a.Group).WithMany(g => g.Assignments).HasForeignKey(a => a.GroupId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(a => new { a.FormId, a.GroupId }).IsUnique();
        });

        // OrgInvite
        modelBuilder.Entity<OrgInvite>(e =>
        {
            e.HasIndex(i => i.Token).IsUnique();
            e.HasOne(i => i.Org).WithMany().HasForeignKey(i => i.OrgId).OnDelete(DeleteBehavior.Cascade);
        });

        // Bills
        modelBuilder.Entity<Bill>(e =>
        {
            e.HasIndex(b => new { b.UserId, b.CreatedAt });
            e.HasOne(b => b.User).WithMany().HasForeignKey(b => b.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(b => b.Items).WithOne(i => i.Bill).HasForeignKey(i => i.BillId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BillItem>(e =>
        {
            e.HasIndex(i => new { i.BillId, i.SortOrder });
        });

        modelBuilder.Entity<BusinessProfile>(e =>
        {
            e.HasIndex(p => new { p.UserId, p.IsDefault });
            e.HasOne(p => p.User).WithMany().HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // Bill templates
        modelBuilder.Entity<BillTemplate>(e =>
        {
            e.HasIndex(t => new { t.UserId, t.Category });
            e.HasOne(t => t.User).WithMany().HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(t => t.Items).WithOne(i => i.Template).HasForeignKey(i => i.TemplateId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BillTemplateItem>(e =>
        {
            e.HasIndex(i => new { i.TemplateId, i.SortOrder });
        });
    }
}
