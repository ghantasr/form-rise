using System.Text;
using System.Threading.RateLimiting;
using FormFlow.Api.Data;
using FormFlow.Api.Helpers;
using FormFlow.Api.Middleware;
using FormFlow.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Response compression
builder.Services.AddResponseCompression(opts =>
{
    opts.EnableForHttps = true;
});

// Database
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// Redis
builder.Services.AddStackExchangeRedisCache(opts =>
    opts.Configuration = builder.Configuration.GetConnectionString("Redis"));

// Auth
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret is required");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.MapInboundClaims = false; // keep "sub" as "sub", don't remap to NameIdentifier
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero
        };
    });
builder.Services.AddAuthorization();

// Rate limiting
builder.Services.AddRateLimiter(opts =>
{
    opts.AddFixedWindowLimiter("otp", o => { o.Window = TimeSpan.FromMinutes(1); o.PermitLimit = 5; });
    opts.AddFixedWindowLimiter("submit", o => { o.Window = TimeSpan.FromMinutes(1); o.PermitLimit = 30; });
    opts.AddFixedWindowLimiter("general", o => { o.Window = TimeSpan.FromMinutes(1); o.PermitLimit = 60; });
});

// CORS
builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(p =>
    {
        var origins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:5173", "http://localhost:3000"];
        p.WithOrigins(origins)
         .AllowAnyMethod()
         .AllowAnyHeader()
         .AllowCredentials();
    }));

// HTTP clients
builder.Services.AddHttpClient("google", c => c.BaseAddress = new Uri("https://oauth2.googleapis.com/"));

// Services
builder.Services.AddScoped<JwtHelper>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IFormService, FormService>();
builder.Services.AddScoped<IResponseService, ResponseService>();
builder.Services.AddScoped<IQrService, QrService>();
builder.Services.AddScoped<IForkService, ForkService>();
builder.Services.AddTransient<IEmailService, EmailService>();
builder.Services.AddScoped<IOrgService, OrgService>();
builder.Services.AddScoped<IAssignmentService, AssignmentService>();

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Auto-run EF Core migrations on startup (needed for Railway/cloud deploys)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.UseResponseCompression();
app.UseMiddleware<ErrorHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();
app.Run();
