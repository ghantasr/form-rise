using FormFlow.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormFlow.Api.Controllers;

[ApiController]
[Route("api/f")]
public class PublicFormController(IFormService formService) : ControllerBase
{
    [HttpGet("{slug}")]
    public async Task<IActionResult> GetForm(string slug)
    {
        var form = await formService.GetPublicFormAsync(slug);
        Response.Headers.CacheControl = "public, max-age=120, stale-while-revalidate=30";
        return Ok(form);
    }

    [HttpGet("{slug}/verify-access")]
    public async Task<IActionResult> VerifyAccess(string slug, [FromQuery] string email)
    {
        var form = await formService.GetPublicFormAsync(slug);
        if (form.AllowedEmails is null || form.AllowedEmails.Length == 0)
            return Ok(new { allowed = true });

        var allowed = form.AllowedEmails.Contains(email, StringComparer.OrdinalIgnoreCase);
        return Ok(new { allowed });
    }
}
