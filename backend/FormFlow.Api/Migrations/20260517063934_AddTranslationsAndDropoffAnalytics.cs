using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTranslationsAndDropoffAnalytics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string[]>(
                name: "EnabledLanguages",
                table: "Forms",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);

            migrationBuilder.AddColumn<JsonDocument>(
                name: "Translations",
                table: "Forms",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ViewCount",
                table: "Forms",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<JsonDocument>(
                name: "Translations",
                table: "FormFields",
                type: "jsonb",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "FieldDropoffs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FormId = table.Column<Guid>(type: "uuid", nullable: false),
                    FieldId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReachCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FieldDropoffs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FieldDropoffs_Forms_FormId",
                        column: x => x.FormId,
                        principalTable: "Forms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FieldDropoffs_FormId_FieldId",
                table: "FieldDropoffs",
                columns: new[] { "FormId", "FieldId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FieldDropoffs");

            migrationBuilder.DropColumn(
                name: "EnabledLanguages",
                table: "Forms");

            migrationBuilder.DropColumn(
                name: "Translations",
                table: "Forms");

            migrationBuilder.DropColumn(
                name: "ViewCount",
                table: "Forms");

            migrationBuilder.DropColumn(
                name: "Translations",
                table: "FormFields");
        }
    }
}
