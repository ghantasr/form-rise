namespace FormFlow.Api.Services;

public interface IEmailService
{
    Task SendOtpAsync(string toEmail, string code);
}
