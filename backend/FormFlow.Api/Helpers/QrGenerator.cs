using QRCoder;

namespace FormFlow.Api.Helpers;

public static class QrGenerator
{
    public static byte[] GenerateQrImage(string url)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(url, QRCodeGenerator.ECCLevel.M);
        using var qrCode = new PngByteQRCode(data);
        return qrCode.GetGraphic(10);
    }
}
