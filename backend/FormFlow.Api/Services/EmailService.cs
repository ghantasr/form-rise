using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace FormFlow.Api.Services;

public class EmailService(IConfiguration config) : IEmailService
{
    public async Task SendOtpAsync(string toEmail, string code)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            config["Email:FromName"] ?? "FormRise",
            config["Email:FromAddress"] ?? "noreply@formrise.fyi"));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = $"Your FormRise login code: {code}";

        message.Body = new TextPart("html")
        {
            Text = $"""
                <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
                  <h2 style="color: #1B6B4A;">Your login code</h2>
                  <p style="font-size: 14px; color: #6B6B66;">Use this code to sign in to FormRise. It expires in 5 minutes.</p>
                  <div style="background: #E8F5EE; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1B6B4A;">{code}</span>
                  </div>
                  <p style="font-size: 12px; color: #9C9C96;">If you didn't request this, ignore this email.</p>
                </div>
                """
        };

        using var client = new SmtpClient();

        // macOS blocks CRL (certificate revocation list) fetching, which causes SSL to fail.
        client.CheckCertificateRevocation = false;
        client.ServerCertificateValidationCallback = (sender, certificate, chain, errors) => true;

        await client.ConnectAsync(
            config["Email:SmtpHost"] ?? "smtp-relay.brevo.com",
            int.Parse(config["Email:SmtpPort"] ?? "587"),
            SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(
            config["Email:SmtpUser"],
            config["Email:SmtpPass"]);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    public async Task SendBillEmailAsync(string toEmail, string recipientName, string billNumber, byte[] pdfBytes, string fileName)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            config["Email:FromName"] ?? "FormRise",
            config["Email:FromAddress"] ?? "noreply@formrise.fyi"));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = $"Invoice {billNumber} from {message.From.First().Name}";

        var body = new TextPart("html")
        {
            Text = $"""
                <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
                  <h2 style="color: #1B6B4A;">Invoice {billNumber}</h2>
                  <p style="font-size: 14px; color: #6B6B66;">
                    Dear {recipientName},
                  </p>
                  <p style="font-size: 14px; color: #6B6B66;">
                    Please find your invoice attached to this email.
                  </p>
                  <p style="font-size: 12px; color: #9C9C96; margin-top: 24px;">
                    This invoice was sent via FormRise.
                  </p>
                </div>
                """
        };

        var attachment = new MimePart("text", "html")
        {
            Content = new MimeContent(new MemoryStream(pdfBytes), ContentEncoding.Default),
            ContentDisposition = new ContentDisposition(ContentDisposition.Attachment),
            ContentTransferEncoding = ContentEncoding.Base64,
            FileName = fileName.Replace(".pdf", ".html")
        };

        var multipart = new Multipart("mixed") { body, attachment };
        message.Body = multipart;

        using var client = new SmtpClient();
        client.CheckCertificateRevocation = false;
        client.ServerCertificateValidationCallback = (sender, certificate, chain, errors) => true;

        await client.ConnectAsync(
            config["Email:SmtpHost"] ?? "smtp-relay.brevo.com",
            int.Parse(config["Email:SmtpPort"] ?? "587"),
            SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(
            config["Email:SmtpUser"],
            config["Email:SmtpPass"]);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
