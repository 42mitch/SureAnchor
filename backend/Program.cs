var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "https://zealous-tree-029394910.6.azurestaticapps.net"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
                });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.MapGet("/api/hello", () =>
{
    return Results.Ok(new { message = "Hello from backend!" });
});

app.Run();