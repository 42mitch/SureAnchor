using System.Text.RegularExpressions;
using Backend.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    // Domain 1 — Operational
    public DbSet<Safehouse> Safehouses => Set<Safehouse>();
    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<PartnerAssignment> PartnerAssignments => Set<PartnerAssignment>();

    // Domain 2 — Case Management
    public DbSet<Resident> Residents => Set<Resident>();
    public DbSet<ProcessRecording> ProcessRecordings => Set<ProcessRecording>();
    public DbSet<HomeVisitation> HomeVisitations => Set<HomeVisitation>();
    public DbSet<EducationRecord> EducationRecords => Set<EducationRecord>();
    public DbSet<HealthWellbeingRecord> HealthWellbeingRecords => Set<HealthWellbeingRecord>();
    public DbSet<InterventionPlan> InterventionPlans => Set<InterventionPlan>();
    public DbSet<IncidentReport> IncidentReports => Set<IncidentReport>();
    public DbSet<SafehouseMonthlyMetric> SafehouseMonthlyMetrics => Set<SafehouseMonthlyMetric>();

    // Domain 3 — Donor & Support
    public DbSet<Supporter> Supporters => Set<Supporter>();
    public DbSet<SocialMediaPost> SocialMediaPosts => Set<SocialMediaPost>();
    public DbSet<Donation> Donations => Set<Donation>();
    public DbSet<InKindDonationItem> InKindDonationItems => Set<InKindDonationItem>();
    public DbSet<DonationAllocation> DonationAllocations => Set<DonationAllocation>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();

    // Domain 4 — Outreach
    public DbSet<PublicImpactSnapshot> PublicImpactSnapshots => Set<PublicImpactSnapshot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder); // sets up ASP.NET Identity tables

        ConfigureSafehouses(modelBuilder);
        ConfigurePartners(modelBuilder);
        ConfigurePartnerAssignments(modelBuilder);
        ConfigureResidents(modelBuilder);
        ConfigureProcessRecordings(modelBuilder);
        ConfigureHomeVisitations(modelBuilder);
        ConfigureEducationRecords(modelBuilder);
        ConfigureHealthWellbeingRecords(modelBuilder);
        ConfigureInterventionPlans(modelBuilder);
        ConfigureIncidentReports(modelBuilder);
        ConfigureSafehouseMonthlyMetrics(modelBuilder);
        ConfigureSupporters(modelBuilder);
        ConfigureSocialMediaPosts(modelBuilder);
        ConfigureDonations(modelBuilder);
        ConfigureInKindDonationItems(modelBuilder);
        ConfigureDonationAllocations(modelBuilder);
        ConfigureApplicationUser(modelBuilder);
        ConfigureContactMessages(modelBuilder);

        // Apply snake_case LAST — after all keys/relationships are fully registered
        ApplySnakeCaseNaming(modelBuilder);
    }

    // ── Naming convention ──────────────────────────────────────────────────────

    private static readonly HashSet<string> IdentityTables =
    [
        "AspNetUsers", "AspNetRoles", "AspNetUserRoles",
        "AspNetUserClaims", "AspNetUserLogins", "AspNetUserTokens", "AspNetRoleClaims"
    ];

    private static void ApplySnakeCaseNaming(ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            var tableName = entity.GetTableName();
            if (tableName is null || IdentityTables.Contains(tableName)) continue;

            foreach (var property in entity.GetProperties())
            {
                // Skip properties that already have an explicit [Column] attribute
                if (property.GetColumnName() == property.Name)
                    property.SetColumnName(ToSnakeCase(property.Name));
            }
        }
    }

    private static string ToSnakeCase(string name) =>
        Regex.Replace(name, "([a-z0-9])([A-Z])", "$1_$2").ToLower();

    // ── Domain 1 ──────────────────────────────────────────────────────────────

    private static void ConfigureSafehouses(ModelBuilder b)
    {
        b.Entity<Safehouse>(e =>
        {
            e.HasIndex(s => s.SafehouseCode).IsUnique();
            e.Property(s => s.Country).HasDefaultValue("Philippines");
            e.Property(s => s.CurrentOccupancy).HasDefaultValue(0);
            e.HasCheckConstraint("ck_safehouses_status", "status IN ('Active', 'Inactive')");
        });
    }

    private static void ConfigurePartners(ModelBuilder b)
    {
        b.Entity<Partner>(e =>
        {
            e.HasCheckConstraint("ck_partners_partner_type", "partner_type IN ('Organization', 'Individual')");
            e.HasCheckConstraint("ck_partners_role_type", "role_type IN ('Education','Evaluation','SafehouseOps','FindSafehouse','Logistics','Transport','Maintenance')");
            e.HasCheckConstraint("ck_partners_status", "status IN ('Active', 'Inactive')");
        });
    }

    private static void ConfigurePartnerAssignments(ModelBuilder b)
    {
        b.Entity<PartnerAssignment>(e =>
        {
            e.HasOne(a => a.Partner).WithMany(p => p.Assignments).HasForeignKey(a => a.PartnerId);
            e.HasOne(a => a.Safehouse).WithMany(s => s.PartnerAssignments).HasForeignKey(a => a.SafehouseId);
            e.HasCheckConstraint("ck_partner_assignments_program_area", "program_area IN ('Education','Wellbeing','Operations','Transport','Maintenance')");
            e.HasCheckConstraint("ck_partner_assignments_status", "status IN ('Active', 'Ended')");
        });
    }

    // ── Domain 2 ──────────────────────────────────────────────────────────────

    private static void ConfigureResidents(ModelBuilder b)
    {
        b.Entity<Resident>(e =>
        {
            e.HasIndex(r => r.CaseControlNo).IsUnique();
            e.HasIndex(r => r.InternalCode).IsUnique();
            e.HasIndex(r => r.SafehouseId).HasDatabaseName("ix_residents_safehouse");
            e.HasIndex(r => r.CaseStatus).HasDatabaseName("ix_residents_status");
            e.HasIndex(r => r.CurrentRiskLevel).HasDatabaseName("ix_residents_risk");

            e.Property(r => r.Sex).HasColumnType("nchar(1)").HasDefaultValue("F");
            e.Property(r => r.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            e.HasOne(r => r.Safehouse).WithMany(s => s.Residents).HasForeignKey(r => r.SafehouseId);

            e.HasCheckConstraint("ck_residents_case_status", "case_status IN ('Active','Closed','Transferred')");
            e.HasCheckConstraint("ck_residents_birth_status", "birth_status IS NULL OR birth_status IN ('Marital','Non-Marital')");
            e.HasCheckConstraint("ck_residents_case_category", "case_category IS NULL OR case_category IN ('Abandoned','Foundling','Surrendered','Neglected')");
            e.HasCheckConstraint("ck_residents_referral_source", "referral_source IS NULL OR referral_source IN ('Government Agency','NGO','Police','Self-Referral','Community','Court Order')");
            e.HasCheckConstraint("ck_residents_reintegration_type", "reintegration_type IS NULL OR reintegration_type IN ('Family Reunification','Foster Care','Adoption (Domestic)','Adoption (Inter-Country)','Independent Living','None')");
            e.HasCheckConstraint("ck_residents_reintegration_status", "reintegration_status IS NULL OR reintegration_status IN ('Not Started','In Progress','Completed','On Hold')");
            e.HasCheckConstraint("ck_residents_initial_risk", "initial_risk_level IS NULL OR initial_risk_level IN ('Low','Medium','High','Critical')");
            e.HasCheckConstraint("ck_residents_current_risk", "current_risk_level IS NULL OR current_risk_level IN ('Low','Medium','High','Critical')");
        });
    }

    private static void ConfigureProcessRecordings(ModelBuilder b)
    {
        b.Entity<ProcessRecording>(e =>
        {
            e.HasIndex(r => new { r.ResidentId, r.SessionDate }).HasDatabaseName("ix_process_resident");
            e.HasOne(r => r.Resident).WithMany(res => res.ProcessRecordings).HasForeignKey(r => r.ResidentId);
            e.HasCheckConstraint("ck_process_recordings_session_type", "session_type IN ('Individual','Group')");
            e.HasCheckConstraint("ck_process_recordings_state_observed", "emotional_state_observed IS NULL OR emotional_state_observed IN ('Calm','Anxious','Sad','Angry','Hopeful','Withdrawn','Happy','Distressed')");
            e.HasCheckConstraint("ck_process_recordings_state_end", "emotional_state_end IS NULL OR emotional_state_end IN ('Calm','Anxious','Sad','Angry','Hopeful','Withdrawn','Happy','Distressed')");
        });
    }

    private static void ConfigureHomeVisitations(ModelBuilder b)
    {
        b.Entity<HomeVisitation>(e =>
        {
            e.HasIndex(v => new { v.ResidentId, v.VisitDate }).HasDatabaseName("ix_visitations_resident");
            e.HasOne(v => v.Resident).WithMany(r => r.HomeVisitations).HasForeignKey(v => v.ResidentId);
            e.HasCheckConstraint("ck_home_visitations_visit_type", "visit_type IN ('Initial Assessment','Routine Follow-Up','Reintegration Assessment','Post-Placement Monitoring','Emergency')");
            e.HasCheckConstraint("ck_home_visitations_cooperation", "family_cooperation_level IS NULL OR family_cooperation_level IN ('Highly Cooperative','Cooperative','Neutral','Uncooperative')");
            e.HasCheckConstraint("ck_home_visitations_outcome", "visit_outcome IS NULL OR visit_outcome IN ('Favorable','Needs Improvement','Unfavorable','Inconclusive')");
        });
    }

    private static void ConfigureEducationRecords(ModelBuilder b)
    {
        b.Entity<EducationRecord>(e =>
        {
            e.HasIndex(r => new { r.ResidentId, r.RecordDate }).HasDatabaseName("ix_education_resident");
            e.HasOne(r => r.Resident).WithMany(res => res.EducationRecords).HasForeignKey(r => r.ResidentId);
            e.Property(r => r.AttendanceRate).HasPrecision(5, 4);
            e.Property(r => r.ProgressPercent).HasPrecision(6, 2);
            e.HasCheckConstraint("ck_education_records_level", "education_level IS NULL OR education_level IN ('Primary','Secondary','Vocational','CollegePrep')");
            e.HasCheckConstraint("ck_education_records_completion", "completion_status IS NULL OR completion_status IN ('NotStarted','InProgress','Completed')");
        });
    }

    private static void ConfigureHealthWellbeingRecords(ModelBuilder b)
    {
        b.Entity<HealthWellbeingRecord>(e =>
        {
            e.HasIndex(r => new { r.ResidentId, r.RecordDate }).HasDatabaseName("ix_health_resident");
            e.HasOne(r => r.Resident).WithMany(res => res.HealthRecords).HasForeignKey(r => r.ResidentId);
            e.Property(r => r.GeneralHealthScore).HasPrecision(4, 2);
            e.Property(r => r.NutritionScore).HasPrecision(4, 2);
            e.Property(r => r.SleepQualityScore).HasPrecision(4, 2);
            e.Property(r => r.EnergyLevelScore).HasPrecision(4, 2);
            e.Property(r => r.HeightCm).HasPrecision(5, 1);
            e.Property(r => r.WeightKg).HasPrecision(5, 1);
            e.Property(r => r.Bmi).HasPrecision(5, 2);
        });
    }

    private static void ConfigureInterventionPlans(ModelBuilder b)
    {
        b.Entity<InterventionPlan>(e =>
        {
            e.HasIndex(p => new { p.ResidentId, p.Status }).HasDatabaseName("ix_interventions_resident");
            e.HasOne(p => p.Resident).WithMany(r => r.InterventionPlans).HasForeignKey(p => p.ResidentId);
            e.Property(p => p.TargetValue).HasPrecision(10, 2);
            e.Property(p => p.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            e.Property(p => p.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
            e.HasCheckConstraint("ck_intervention_plans_category", "plan_category IN ('Safety','Psychosocial','Education','Physical Health','Legal','Reintegration')");
            e.HasCheckConstraint("ck_intervention_plans_status", "status IN ('Open','In Progress','Achieved','On Hold','Closed')");
        });
    }

    private static void ConfigureIncidentReports(ModelBuilder b)
    {
        b.Entity<IncidentReport>(e =>
        {
            e.HasIndex(r => new { r.SafehouseId, r.IncidentDate }).HasDatabaseName("ix_incidents_safehouse");
            e.HasOne(r => r.Resident).WithMany(res => res.IncidentReports).HasForeignKey(r => r.ResidentId);
            e.HasOne(r => r.Safehouse).WithMany(s => s.IncidentReports).HasForeignKey(r => r.SafehouseId);
            e.HasCheckConstraint("ck_incident_reports_type", "incident_type IN ('Behavioral','Medical','Security','RunawayAttempt','SelfHarm','ConflictWithPeer','PropertyDamage')");
            e.HasCheckConstraint("ck_incident_reports_severity", "severity IN ('Low','Medium','High')");
        });
    }

    private static void ConfigureSafehouseMonthlyMetrics(ModelBuilder b)
    {
        b.Entity<SafehouseMonthlyMetric>(e =>
        {
            e.HasIndex(m => new { m.SafehouseId, m.MonthStart }).IsUnique().HasDatabaseName("ix_metrics_safehouse_month");
            e.HasOne(m => m.Safehouse).WithMany(s => s.MonthlyMetrics).HasForeignKey(m => m.SafehouseId);
            e.Property(m => m.AvgEducationProgress).HasPrecision(6, 2);
            e.Property(m => m.AvgHealthScore).HasPrecision(4, 2);
            e.Property(m => m.ProcessRecordingCount).HasDefaultValue(0);
            e.Property(m => m.HomeVisitationCount).HasDefaultValue(0);
            e.Property(m => m.IncidentCount).HasDefaultValue(0);
        });
    }

    // ── Domain 3 ──────────────────────────────────────────────────────────────

    private static void ConfigureSupporters(ModelBuilder b)
    {
        b.Entity<Supporter>(e =>
        {
            e.Property(s => s.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            e.HasCheckConstraint("ck_supporters_type", "supporter_type IN ('MonetaryDonor','InKindDonor','Volunteer','SkillsContributor','SocialMediaAdvocate','PartnerOrganization')");
            e.HasCheckConstraint("ck_supporters_relationship", "relationship_type IS NULL OR relationship_type IN ('Local','International','PartnerOrganization')");
            e.HasCheckConstraint("ck_supporters_status", "status IN ('Active','Inactive')");
            e.HasCheckConstraint("ck_supporters_channel", "acquisition_channel IS NULL OR acquisition_channel IN ('Website','SocialMedia','Event','WordOfMouth','PartnerReferral','Church')");
        });
    }

    private static void ConfigureSocialMediaPosts(ModelBuilder b)
    {
        b.Entity<SocialMediaPost>(e =>
        {
            e.HasIndex(p => new { p.Platform, p.CreatedAt }).HasDatabaseName("ix_posts_platform");
            e.Property(p => p.NumHashtags).HasDefaultValue(0);
            e.Property(p => p.MentionsCount).HasDefaultValue(0);
            e.Property(p => p.BoostBudgetPhp).HasPrecision(12, 2);
            e.Property(p => p.EngagementRate).HasPrecision(8, 4);
            e.Property(p => p.EstimatedDonationValuePhp).HasPrecision(14, 2);
            e.HasCheckConstraint("ck_social_media_posts_platform", "platform IN ('Facebook','Instagram','Twitter','TikTok','LinkedIn','YouTube','WhatsApp')");
            e.HasCheckConstraint("ck_social_media_posts_post_type", "post_type IS NULL OR post_type IN ('ImpactStory','Campaign','EventPromotion','ThankYou','EducationalContent','FundraisingAppeal')");
            e.HasCheckConstraint("ck_social_media_posts_media_type", "media_type IS NULL OR media_type IN ('Photo','Video','Carousel','Text','Reel')");
            e.HasCheckConstraint("ck_social_media_posts_cta_type", "call_to_action_type IS NULL OR call_to_action_type IN ('DonateNow','LearnMore','ShareStory','SignUp')");
            e.HasCheckConstraint("ck_social_media_posts_content_topic", "content_topic IS NULL OR content_topic IN ('Education','Health','Reintegration','DonorImpact','SafehouseLife','EventRecap','CampaignLaunch','Gratitude','AwarenessRaising')");
            e.HasCheckConstraint("ck_social_media_posts_sentiment", "sentiment_tone IS NULL OR sentiment_tone IN ('Hopeful','Urgent','Celebratory','Informative','Grateful','Emotional')");
        });
    }

    private static void ConfigureDonations(ModelBuilder b)
    {
        b.Entity<Donation>(e =>
        {
            e.HasIndex(d => new { d.SupporterId, d.DonationDate }).HasDatabaseName("ix_donations_supporter");
            e.HasOne(d => d.Supporter).WithMany(s => s.Donations).HasForeignKey(d => d.SupporterId);
            e.HasOne(d => d.ReferralPost).WithMany(p => p.Donations).HasForeignKey(d => d.ReferralPostId).IsRequired(false);
            e.Property(d => d.Amount).HasPrecision(14, 2);
            e.Property(d => d.EstimatedValue).HasPrecision(14, 2);
            e.HasCheckConstraint("ck_donations_type", "donation_type IN ('Monetary','InKind','Time','Skills','SocialMedia')");
            e.HasCheckConstraint("ck_donations_channel_source", "channel_source IS NULL OR channel_source IN ('Campaign','Event','Direct','SocialMedia','PartnerReferral')");
            e.HasCheckConstraint("ck_donations_impact_unit", "impact_unit IS NULL OR impact_unit IN ('pesos','items','hours','campaigns')");
        });
    }

    private static void ConfigureInKindDonationItems(ModelBuilder b)
    {
        b.Entity<InKindDonationItem>(e =>
        {
            e.HasOne(i => i.Donation).WithMany(d => d.InKindItems).HasForeignKey(i => i.DonationId);
            e.Property(i => i.EstimatedUnitValue).HasPrecision(12, 2);
            e.HasCheckConstraint("ck_in_kind_items_category", "item_category IS NULL OR item_category IN ('Food','Supplies','Clothing','SchoolMaterials','Hygiene','Furniture','Medical')");
            e.HasCheckConstraint("ck_in_kind_items_uom", "unit_of_measure IS NULL OR unit_of_measure IN ('pcs','boxes','kg','sets','packs')");
            e.HasCheckConstraint("ck_in_kind_items_intended_use", "intended_use IS NULL OR intended_use IN ('Meals','Education','Shelter','Hygiene','Health')");
            e.HasCheckConstraint("ck_in_kind_items_condition", "received_condition IS NULL OR received_condition IN ('New','Good','Fair')");
        });
    }

    private static void ConfigureDonationAllocations(ModelBuilder b)
    {
        b.Entity<DonationAllocation>(e =>
        {
            e.HasIndex(a => a.DonationId).HasDatabaseName("ix_allocations_donation");
            e.HasIndex(a => a.SafehouseId).HasDatabaseName("ix_allocations_safehouse");
            e.HasOne(a => a.Donation).WithMany(d => d.Allocations).HasForeignKey(a => a.DonationId);
            e.HasOne(a => a.Safehouse).WithMany(s => s.DonationAllocations).HasForeignKey(a => a.SafehouseId);
            e.Property(a => a.AmountAllocated).HasPrecision(14, 2);
            e.HasCheckConstraint("ck_donation_allocations_program_area", "program_area IN ('Education','Wellbeing','Operations','Transport','Maintenance','Outreach')");
        });
    }

    // ── Identity ──────────────────────────────────────────────────────────────

    private static void ConfigureApplicationUser(ModelBuilder b)
    {
        b.Entity<ApplicationUser>(e =>
        {
            e.HasOne(u => u.Supporter)
             .WithMany()
             .HasForeignKey(u => u.SupporterId)
             .IsRequired(false);
        });
    }
}
