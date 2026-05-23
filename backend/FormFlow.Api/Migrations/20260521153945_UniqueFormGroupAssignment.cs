using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class UniqueFormGroupAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Remove duplicate (FormId, GroupId) pairs, keeping the most recent one
            migrationBuilder.Sql(@"
                DELETE FROM ""FormAssignments""
                WHERE ""Id"" NOT IN (
                    SELECT DISTINCT ON (""FormId"", ""GroupId"") ""Id""
                    FROM ""FormAssignments""
                    ORDER BY ""FormId"", ""GroupId"", ""CreatedAt"" DESC
                );
            ");

            migrationBuilder.DropIndex(
                name: "IX_FormAssignments_FormId",
                table: "FormAssignments");

            migrationBuilder.CreateIndex(
                name: "IX_FormAssignments_FormId_GroupId",
                table: "FormAssignments",
                columns: new[] { "FormId", "GroupId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_FormAssignments_FormId_GroupId",
                table: "FormAssignments");

            migrationBuilder.CreateIndex(
                name: "IX_FormAssignments_FormId",
                table: "FormAssignments",
                column: "FormId");
        }
    }
}
