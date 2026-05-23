using FormFlow.Api.Models.DTOs.Orgs;
using FormFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FormFlow.Api.Controllers;

[ApiController]
[Authorize]
public class AssignmentController(IAssignmentService assignmentService) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue("sub")!);

    [HttpPost("api/forms/{formId:guid}/assignments")]
    public async Task<IActionResult> CreateAssignment(Guid formId, [FromBody] CreateAssignmentRequest req)
    {
        var assignment = await assignmentService.CreateAssignmentAsync(formId, UserId, req);
        return CreatedAtAction(nameof(GetFormAssignments), new { formId }, assignment);
    }

    [HttpGet("api/forms/{formId:guid}/assignments")]
    public async Task<IActionResult> GetFormAssignments(Guid formId) =>
        Ok(await assignmentService.GetFormAssignmentsAsync(formId, UserId));

    [HttpDelete("api/forms/{formId:guid}/assignments/{id:guid}")]
    public async Task<IActionResult> DeleteAssignment(Guid formId, Guid id)
    {
        await assignmentService.DeleteAssignmentAsync(formId, id, UserId);
        return NoContent();
    }

    [HttpGet("api/forms/{formId:guid}/assignments/{id:guid}/results")]
    public async Task<IActionResult> GetAssignmentResults(Guid formId, Guid id) =>
        Ok(await assignmentService.GetAssignmentResultsAsync(id, UserId));

    [HttpGet("api/students/results")]
    public async Task<IActionResult> GetMyResults() =>
        Ok(await assignmentService.GetMyResultsAsync(UserId));

    [HttpGet("api/students/assignments")]
    public async Task<IActionResult> GetMyAssignments() =>
        Ok(await assignmentService.GetMyAssignmentsAsync(UserId));

    [HttpGet("api/orgs/{orgId:guid}/assignments")]
    public async Task<IActionResult> GetOrgAssignments(Guid orgId) =>
        Ok(await assignmentService.GetOrgAssignmentsAsync(orgId, UserId));
}
