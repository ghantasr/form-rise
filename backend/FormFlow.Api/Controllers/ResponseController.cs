using FormFlow.Api.Models.DTOs.Responses;
using FormFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using System.Text;

namespace FormFlow.Api.Controllers;

[ApiController]
public class ResponseController(IResponseService responseService) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue("sub")!);

    [HttpPost("api/f/{slug}/submit")]
    [EnableRateLimiting("submit")]
    public async Task<IActionResult> Submit(string slug, [FromBody] SubmitResponseRequest req)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();
        var result = await responseService.SubmitAsync(slug, req, ip, ua);
        return Ok(result);
    }

    [HttpGet("api/forms/{formId:guid}/responses")]
    [Authorize]
    public async Task<IActionResult> List(Guid formId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50) =>
        Ok(await responseService.GetResponsesAsync(formId, UserId, page, pageSize));

    [HttpGet("api/forms/{formId:guid}/responses/{responseId:guid}")]
    [Authorize]
    public async Task<IActionResult> Get(Guid formId, Guid responseId) =>
        Ok(await responseService.GetResponseAsync(formId, responseId, UserId));

    [HttpDelete("api/forms/{formId:guid}/responses/{responseId:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid formId, Guid responseId)
    {
        await responseService.DeleteResponseAsync(formId, responseId, UserId);
        return NoContent();
    }

    [HttpGet("api/forms/{formId:guid}/responses/export")]
    [Authorize]
    public async Task<IActionResult> Export(Guid formId)
    {
        var csv = await responseService.ExportCsvAsync(formId, UserId);
        return File(Encoding.UTF8.GetBytes(csv), "text/csv", $"responses-{formId}.csv");
    }
}
