using FormFlow.Api.Data;
using FormFlow.Api.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FormFlow.Api.Controllers;

[ApiController]
[Route("api")]
public class AnalyticsController(AppDbContext db) : ControllerBase
{
    private Guid? GetUserId()
    {
        var sub = User.FindFirstValue("sub");
        return sub is not null ? Guid.Parse(sub) : null;
    }

    // POST /api/forms/{slug}/analytics/view — no auth required
    [HttpPost("f/{slug}/analytics/view")]
    [AllowAnonymous]
    public async Task<IActionResult> RecordView(string slug)
    {
        var form = await db.Forms.FirstOrDefaultAsync(f => f.Slug == slug && f.Status == "active");
        if (form is null) return NotFound();

        form.ViewCount++;
        await db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // POST /api/forms/{slug}/analytics/field-reach — no auth required
    [HttpPost("f/{slug}/analytics/field-reach")]
    [AllowAnonymous]
    public async Task<IActionResult> RecordFieldReach(string slug, [FromBody] FieldReachRequest req)
    {
        var form = await db.Forms.FirstOrDefaultAsync(f => f.Slug == slug && f.Status == "active");
        if (form is null) return NotFound();

        if (req.FieldIds is null || req.FieldIds.Length == 0)
            return Ok(new { success = true });

        foreach (var fieldIdStr in req.FieldIds)
        {
            if (!Guid.TryParse(fieldIdStr, out var fieldId)) continue;

            var dropoff = await db.FieldDropoffs
                .FirstOrDefaultAsync(d => d.FormId == form.Id && d.FieldId == fieldId);

            if (dropoff is null)
            {
                dropoff = new FieldDropoff { FormId = form.Id, FieldId = fieldId, ReachCount = 1 };
                db.FieldDropoffs.Add(dropoff);
            }
            else
            {
                dropoff.ReachCount++;
            }
        }

        await db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // GET /api/forms/{id}/analytics — auth required, owner only
    [HttpGet("forms/{id:guid}/analytics")]
    [Authorize]
    public async Task<IActionResult> GetAnalytics(Guid id)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var form = await db.Forms
            .Include(f => f.FieldDropoffs)
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);
        if (form is null) return NotFound();

        return Ok(new
        {
            viewCount = form.ViewCount,
            fieldDropoffs = form.FieldDropoffs.Select(d => new
            {
                fieldId = d.FieldId,
                reachCount = d.ReachCount,
            }).ToList(),
        });
    }
}

public record FieldReachRequest(string[]? FieldIds);
