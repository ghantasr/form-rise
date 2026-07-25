namespace FormFlow.Api.Services;

public interface IEmailService
{
    Task SendOtpAsync(string toEmail, string code);
    Task SendBillEmailAsync(string toEmail, string recipientName, string billNumber, byte[] pdfBytes, string fileName);
}