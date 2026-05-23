using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddQuizMode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsQuizMode",
                table: "Forms",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "PassMark",
                table: "Forms",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsPassed",
                table: "FormResponses",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxScore",
                table: "FormResponses",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalScore",
                table: "FormResponses",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<JsonDocument>(
                name: "QuizConfig",
                table: "FormFields",
                type: "jsonb",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsQuizMode",
                table: "Forms");

            migrationBuilder.DropColumn(
                name: "PassMark",
                table: "Forms");

            migrationBuilder.DropColumn(
                name: "IsPassed",
                table: "FormResponses");

            migrationBuilder.DropColumn(
                name: "MaxScore",
                table: "FormResponses");

            migrationBuilder.DropColumn(
                name: "TotalScore",
                table: "FormResponses");

            migrationBuilder.DropColumn(
                name: "QuizConfig",
                table: "FormFields");
        }
    }
}
