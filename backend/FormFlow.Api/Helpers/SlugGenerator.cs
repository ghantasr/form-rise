namespace FormFlow.Api.Helpers;

public static class SlugGenerator
{
    private const string Chars = "abcdefghijklmnopqrstuvwxyz0123456789";

    public static string Generate(int length = 8)
    {
        var result = new char[length];
        var bytes = new byte[length];
        Random.Shared.NextBytes(bytes);
        for (int i = 0; i < length; i++)
            result[i] = Chars[bytes[i] % Chars.Length];
        return new string(result);
    }
}
