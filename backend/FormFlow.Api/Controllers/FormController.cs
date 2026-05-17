using FormFlow.Api.Data;
using FormFlow.Api.Models.DTOs.Forms;
using FormFlow.Api.Models.Entities;
using FormFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace FormFlow.Api.Controllers;

[ApiController]
[Route("api/forms")]
[Authorize]
public class FormController(IFormService formService, AppDbContext db) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue("sub")!);

    [HttpGet]
    public async Task<IActionResult> List() =>
        Ok(await formService.GetUserFormsAsync(UserId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFormRequest req)
    {
        var form = await formService.CreateFormAsync(UserId, req);
        return CreatedAtAction(nameof(Get), new { id = form.Id }, form);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id) =>
        Ok(await formService.GetFormAsync(id, UserId));

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateFormRequest req) =>
        Ok(await formService.UpdateFormAsync(id, UserId, req));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await formService.DeleteFormAsync(id, UserId);
        return NoContent();
    }

    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid id) =>
        Ok(await formService.PublishFormAsync(id, UserId));

    [HttpPost("{id:guid}/unpublish")]
    public async Task<IActionResult> Unpublish(Guid id) =>
        Ok(await formService.UnpublishFormAsync(id, UserId));

    [HttpPut("{id:guid}/translations")]
    public async Task<IActionResult> UpdateTranslations(Guid id, [FromBody] UpdateTranslationsRequest req)
    {
        var form = await db.Forms
            .Include(f => f.Fields)
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == UserId);
        if (form is null) return NotFound();

        form.EnabledLanguages = req.EnabledLanguages ?? [];
        if (req.FormTranslations is not null)
            form.Translations = JsonDocument.Parse(JsonSerializer.Serialize(req.FormTranslations));

        if (req.FieldTranslations is not null)
        {
            foreach (var field in form.Fields)
            {
                if (req.FieldTranslations.TryGetValue(field.Id.ToString(), out var fieldTranslation))
                    field.Translations = JsonDocument.Parse(JsonSerializer.Serialize(fieldTranslation));
            }
        }

        form.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(new { success = true });
    }
}

public record UpdateTranslationsRequest(
    string[]? EnabledLanguages,
    object? FormTranslations,
    Dictionary<string, object>? FieldTranslations
);
