using FormFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FormFlow.Api.Controllers;

[ApiController]
[Route("api/templates")]
public class TemplateController(IForkService forkService) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue("sub")!);

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] string sort = "popular") =>
        Ok(await forkService.GetTemplatesAsync(page, pageSize, sort));

    [HttpPost("{slug}/fork")]
    [Authorize]
    public async Task<IActionResult> Fork(string slug)
    {
        var form = await forkService.ForkAsync(slug, UserId);
        return Ok(form);
    }
}
