using FormFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FormFlow.Api.Controllers;

[ApiController]
[Route("api/forms/{formId:guid}/qr")]
[Authorize]
public class QrController(IQrService qrService) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue("sub")!);

    [HttpPost]
    public async Task<IActionResult> Generate(Guid formId, [FromBody] QrCreateRequest req) =>
        Ok(await qrService.GenerateAsync(formId, UserId, req));

    [HttpGet]
    public async Task<IActionResult> List(Guid formId) =>
        Ok(await qrService.GetByFormAsync(formId, UserId));

    [HttpDelete("{qrId:guid}")]
    public async Task<IActionResult> Delete(Guid formId, Guid qrId)
    {
        await qrService.DeleteAsync(formId, qrId, UserId);
        return NoContent();
    }
}
