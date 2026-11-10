using Lab6.McpServer.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ModelContextProtocol.Server;

var builder = Host.CreateApplicationBuilder(args);

// Перенаправляємо всі системні логи у stderr, щоб stdout залишався чистим
// для JSON-RPC повідомлень протоколу MCP.
builder.Logging.ClearProviders();
builder.Logging.AddConsole(options =>
{
    options.LogToStandardErrorThreshold = LogLevel.Trace;
});

// Визначаємо шлях до файлу SQLite у папці збірки проєкту
string dbPath = Path.Combine(AppContext.BaseDirectory, "lab6_authors.db");

// 1. Реєструємо контекст бази даних SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

// 2. Реєструємо MCP-сервер зі стандартним транспортом stdio та інструментами з поточної збірки
builder.Services
    .AddMcpServer()
    .WithStdioServerTransport()
    .WithToolsFromAssembly();

var app = builder.Build();

// 3. Ініціалізуємо та наповнюємо базу даних тестовими записами (Варіант 9)
AppDbContext.InitializeDatabase(app.Services);

await app.RunAsync();
