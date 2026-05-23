using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrgGroupIsDefault : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDefault",
                table: "OrgGroups",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // For every existing org that has no default group yet,
            // create an "Everyone" group and add all current org members to it.
            migrationBuilder.Sql(@"
                INSERT INTO ""OrgGroups"" (""Id"", ""OrgId"", ""Name"", ""IsDefault"", ""CreatedBy"")
                SELECT
                    gen_random_uuid(),
                    o.""Id"",
                    'Everyone',
                    true,
                    o.""CreatedBy""
                FROM ""Organizations"" o
                WHERE NOT EXISTS (
                    SELECT 1 FROM ""OrgGroups"" g
                    WHERE g.""OrgId"" = o.""Id"" AND g.""IsDefault"" = true
                );

                INSERT INTO ""GroupMembers"" (""GroupId"", ""UserId"", ""AddedAt"")
                SELECT
                    g.""Id"",
                    m.""UserId"",
                    NOW()
                FROM ""OrgGroups"" g
                JOIN ""OrgMembers"" m ON m.""OrgId"" = g.""OrgId""
                WHERE g.""IsDefault"" = true
                AND NOT EXISTS (
                    SELECT 1 FROM ""GroupMembers"" gm
                    WHERE gm.""GroupId"" = g.""Id"" AND gm.""UserId"" = m.""UserId""
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDefault",
                table: "OrgGroups");
        }
    }
}
