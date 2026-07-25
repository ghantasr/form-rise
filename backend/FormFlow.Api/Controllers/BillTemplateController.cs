using FormFlow.Api.Models.DTOs.Bills;
using FormFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FormFlow.Api.Controllers;

[ApiController]
[Route("api/bill-templates")]
[Authorize]
public class BillTemplateController(IBillTemplateService service) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue("sub")!);

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? category)
    {
        var templates = await service.GetTemplatesAsync(UserId, category);
        return Ok(templates);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var template = await service.GetTemplateAsync(id, UserId);
        if (template is null) return NotFound();
        return Ok(template);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBillTemplateRequest req)
    {
        var template = await service.CreateTemplateAsync(UserId, req);
        return CreatedAtAction(nameof(Get), new { id = template.Id }, template);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBillTemplateRequest req)
    {
        var template = await service.UpdateTemplateAsync(id, UserId, req);
        return Ok(template);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await service.DeleteTemplateAsync(id, UserId);
        return NoContent();
    }
}