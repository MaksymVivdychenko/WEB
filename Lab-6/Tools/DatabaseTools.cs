using System.ComponentModel;
using System.Text.Json;
using Lab6.McpServer.Data;
using Microsoft.EntityFrameworkCore;
using ModelContextProtocol.Server;

namespace Lab6.McpServer.Tools;

/// <summary>
/// Набір MCP-інструментів (Tools) для роботи з базою даних авторів та статей (Варіант 9).
/// </summary>
[McpServerToolType]
public static class DatabaseTools
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    // =========================================================================
    // 1. ОТРИМАННЯ ТА СОРТУВАННЯ АВТОРІВ (Готовий інструмент — приклад №1)
    // =========================================================================
    [McpServerTool(Name = "get_authors")]
    [Description("Отримати список усіх авторів веб-сайту з таблиці 'users' з можливістю сортування за полем (id, name, username, address) та напрямком (asc, desc).")]
    public static async Task<string> GetAuthorsAsync(
        AppDbContext db,
        [Description("Поле для сортування: 'id', 'name', 'username' або 'address'. За замовчуванням 'id'.")]
        string sortBy = "id",
        [Description("Напрямок сортування: 'asc' (за зростанням) або 'desc' (за спаданням). За замовчуванням 'asc'.")]
        string order = "asc")
    {
        IQueryable<User> query = db.Users.AsNoTracking();

        bool isDesc = string.Equals(order, "desc", StringComparison.OrdinalIgnoreCase);

        query = sortBy.ToLowerInvariant() switch
        {
            "name" => isDesc ? query.OrderByDescending(u => u.Name) : query.OrderBy(u => u.Name),
            "username" => isDesc ? query.OrderByDescending(u => u.Username) : query.OrderBy(u => u.Username),
            "address" => isDesc ? query.OrderByDescending(u => u.Address) : query.OrderBy(u => u.Address),
            _ => isDesc ? query.OrderByDescending(u => u.Id) : query.OrderBy(u => u.Id)
        };

        var authors = await query
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Username,
                u.Address,
                PostsCount = u.Posts.Count
            })
            .ToListAsync();

        return JsonSerializer.Serialize(authors, JsonOptions);
    }

    // =========================================================================
    // 2. ОТРИМАННЯ ТА СОРТУВАННЯ СТАТЕЙ (Готовий інструмент — приклад №2)
    // =========================================================================
    [McpServerTool(Name = "get_posts")]
    [Description("Отримати всі статті з таблиці 'posts' разом з іменем автора. Підтримує сортування за полем (id, title, topic) та напрямком (asc, desc).")]
    public static async Task<string> GetPostsAsync(
        AppDbContext db,
        [Description("Поле для сортування: 'id', 'title' або 'topic'. За замовчуванням 'id'.")]
        string sortBy = "id",
        [Description("Напрямок сортування: 'asc' (за зростанням) або 'desc' (за спаданням). За замовчуванням 'asc'.")]
        string order = "asc")
    {
        IQueryable<Post> query = db.Posts.Include(p => p.Author).AsNoTracking();

        bool isDesc = string.Equals(order, "desc", StringComparison.OrdinalIgnoreCase);

        query = sortBy.ToLowerInvariant() switch
        {
            "title" => isDesc ? query.OrderByDescending(p => p.Title) : query.OrderBy(p => p.Title),
            "topic" => isDesc ? query.OrderByDescending(p => p.Topic) : query.OrderBy(p => p.Topic),
            _ => isDesc ? query.OrderByDescending(p => p.Id) : query.OrderBy(p => p.Id)
        };

        var posts = await query
            .Select(p => new
            {
                p.Id,
                p.Topic,
                p.Title,
                p.Content,
                p.ImageUrl,
                AuthorId = p.UserId,
                AuthorName = p.Author != null ? p.Author.Name : "Невідомий"
            })
            .ToListAsync();

        return JsonSerializer.Serialize(posts, JsonOptions);
    }

    // =========================================================================
    // 3. ПОШУК АВТОРІВ ЗА КРИТЕРІЄМ (Готовий інструмент — приклад №3)
    // =========================================================================
    [McpServerTool(Name = "search_authors")]
    [Description("Пошук авторів у базі даних за частиною імені, логіна (username) або адреси (місто, вулиця).")]
    public static async Task<string> SearchAuthorsAsync(
        AppDbContext db,
        [Description("Рядок для пошуку (наприклад: 'Київ', 'Політехнічна', 'Вівдиченко').")]
        string searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return "Помилка: вкажіть непорожній пошуковий запит (searchTerm).";
        }

        string pattern = $"%{searchTerm.Trim()}%";

        var matchedAuthors = await db.Users
            .AsNoTracking()
            .Where(u =>
                EF.Functions.Like(u.Name, pattern) ||
                EF.Functions.Like(u.Address, pattern) ||
                EF.Functions.Like(u.Username, pattern))
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Username,
                u.Address
            })
            .ToListAsync();

        return JsonSerializer.Serialize(matchedAuthors, JsonOptions);
    }

    // =========================================================================
    // 4. ПОШУК СТАТЕЙ У БАЗІ ДАНИХ ЗА ТЕМОЮ ТА КЛЮЧОВИМ СЛОВОМ
    // =========================================================================
    [McpServerTool(Name = "search_posts")]
    [Description("Пошук та фільтрація статей у таблиці 'posts' за темою (topic) та/або ключовим словом (keyword) у заголовку чи тексті статті. Можна передавати один або обидва параметри.")]
    public static async Task<string> SearchPostsAsync(
        AppDbContext db,
        [Description("Ключове слово або фраза для пошуку у заголовку (title) або тексті (content) статті (наприклад: 'MCP', 'SQLite', 'JWT', 'WebSocket'). Необов'язковий параметр.")]
        string? keyword = null,
        [Description("Тема статті для фільтрації за полем 'topic' (наприклад: 'Web-технології', 'Бази даних', 'Інформаційна безпека', 'Штучний інтелект'). Необов'язковий параметр.")]
        string? topic = null)
    {
        var request = db.Posts
            .Include(p => p.Author)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            string kw = keyword.Trim();
            request = request.Where(p => p.Title.Contains(kw) || p.Content.Contains(kw));
        }

        if (!string.IsNullOrWhiteSpace(topic))
        {
            string tp = topic.Trim();
            request = request.Where(p => p.Topic.Contains(tp));
        }

        var results = await request
            .Select(p => new
            {
                p.Id,
                p.Topic,
                p.Title,
                p.Content,
                p.ImageUrl,
                AuthorId = p.UserId,
                AuthorName = p.Author != null ? p.Author.Name : "Невідомий"
            })
            .ToListAsync();

        return JsonSerializer.Serialize(results, JsonOptions);
    }
}