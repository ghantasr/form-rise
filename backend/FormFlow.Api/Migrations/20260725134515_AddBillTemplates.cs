using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBillTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BillTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Category = table.Column<string>(type: "text", nullable: false),
                    Currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    TaxRate = table.Column<decimal>(type: "numeric", nullable: false),
                    TaxLabel = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SenderName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SenderEmail = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    SenderAddress = table.Column<string>(type: "text", nullable: true),
                    SenderGstin = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    SenderLogoBase64 = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    PaymentTerms = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    BankName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    BankAccount = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    BankIfsc = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BillTemplates_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BillTemplateItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    Taxable = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillTemplateItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BillTemplateItems_BillTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "BillTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BillTemplateItems_TemplateId_SortOrder",
                table: "BillTemplateItems",
                columns: new[] { "TemplateId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_BillTemplates_UserId_Category",
                table: "BillTemplates",
                columns: new[] { "UserId", "Category" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BillTemplateItems");

            migrationBuilder.DropTable(
                name: "BillTemplates");
        }
    }
}
