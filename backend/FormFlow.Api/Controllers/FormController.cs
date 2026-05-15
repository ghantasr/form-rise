using FormFlow.Api.Models.DTOs.Forms;
using FormFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FormFlow.Api.Controllers;

[ApiController]
[Route("api/forms")]
[Authorize]
public class FormController(IFormService formService) : ControllerBase
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
}
