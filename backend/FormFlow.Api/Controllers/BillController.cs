using FormFlow.Api.Models.DTOs.Bills;
using FormFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FormFlow.Api.Controllers;

[ApiController]
[Route("api/bills")]
[Authorize]
public class BillController(IBillService billService) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue("sub")!);

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var bills = await billService.GetBillsAsync(UserId, search, status, page, pageSize);
        return Ok(bills);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBillRequest req)
    {
        var bill = await billService.CreateBillAsync(UserId, req);
        return CreatedAtAction(nameof(Get), new { id = bill.Id }, bill);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var bill = await billService.GetBillAsync(id, UserId);
        return Ok(bill);
    }

    [HttpGet("by-number/{billNumber}")]
    public async Task<IActionResult> GetByNumber(string billNumber)
    {
        var bill = await billService.GetBillByNumberAsync(UserId, billNumber);
        if (bill is null) return NotFound();
        return Ok(bill);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBillRequest req)
    {
        var bill = await billService.UpdateBillAsync(id, UserId, req);
        return Ok(bill);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await billService.DeleteBillAsync(id, UserId);
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateBillStatusRequest req)
    {
        var bill = await billService.UpdateStatusAsync(id, UserId, req.Status);
        return Ok(bill);
    }

    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> DownloadPdf(Guid id)
    {
        var pdf = await billService.GeneratePdfAsync(id, UserId);
        return File(pdf, "text/html; charset=utf-8", $"bill-{id.ToString()[..8]}.html");
    }

    /// <summary>
    /// Returns the rendered invoice HTML as a page — useful for print-to-PDF and preview iframes.
    /// </summary>
    [HttpGet("{id:guid}/preview")]
    public async Task<IActionResult> Preview(Guid id)
    {
        var html = await billService.GeneratePdfAsync(id, UserId);
        return Content(System.Text.Encoding.UTF8.GetString(html), "text/html; charset=utf-8");
    }

    [HttpPost("{id:guid}/send")]
    public async Task<IActionResult> Send(Guid id)
    {
        await billService.SendBillAsync(id, UserId);
        return Ok(new { success = true });
    }

    [HttpGet("next-number")]
    public async Task<IActionResult> NextBillNumber([FromQuery] string? prefix)
    {
        var number = await billService.GetNextBillNumberAsync(UserId, prefix ?? "INV-");
        return Ok(new NextBillNumberResponse(number));
    }
}