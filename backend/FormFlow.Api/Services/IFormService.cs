using FormFlow.Api.Models.DTOs.Forms;

namespace FormFlow.Api.Services;

public interface IFormService
{
    Task<List<FormListItemDto>> GetUserFormsAsync(Guid userId);
    Task<FormDto> GetFormAsync(Guid formId, Guid userId);
    Task<FormDto?> GetFormBySlugAsync(Guid userId, string slug);
    Task<FormDto> GetPublicFormAsync(string slug);
    Task<FormDto> CreateFormAsync(Guid userId, CreateFormRequest req);
    Task<FormDto> UpdateFormAsync(Guid formId, Guid userId, UpdateFormRequest req);
    Task DeleteFormAsync(Guid formId, Guid userId);
    Task<FormDto> PublishFormAsync(Guid formId, Guid userId);
    Task<FormDto> UnpublishFormAsync(Guid formId, Guid userId);
}
