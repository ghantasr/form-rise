using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBillHeaderOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HeaderOrder",
                table: "Bills",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InvoiceLabel",
                table: "Bills",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HeaderOrder",
                table: "Bills");

            migrationBuilder.DropColumn(
                name: "InvoiceLabel",
                table: "Bills");
        }
    }
}
