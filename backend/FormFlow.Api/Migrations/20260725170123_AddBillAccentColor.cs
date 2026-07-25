using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBillAccentColor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AccentColor",
                table: "BillTemplates",
                type: "character varying(7)",
                maxLength: 7,
                nullable: false,
                defaultValue: "#1B6B4A");

            migrationBuilder.AddColumn<string>(
                name: "AccentColor",
                table: "Bills",
                type: "character varying(7)",
                maxLength: 7,
                nullable: false,
                defaultValue: "#1B6B4A");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AccentColor",
                table: "BillTemplates");

            migrationBuilder.DropColumn(
                name: "AccentColor",
                table: "Bills");
        }
    }
}