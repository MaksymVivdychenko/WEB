using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Lab6.McpServer.Data;

/// <summary>
/// Модель автора веб-сайту (Варіант 9: ім'я, адреса, обліковий запис, пароль).
/// </summary>
[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Column("address")]
    public string Address { get; set; } = string.Empty;

    [Required]
    [Column("username")]
    public string Username { get; set; } = string.Empty;

    [Required]
    [Column("password")]
    public string Password { get; set; } = string.Empty;

    [JsonIgnore]
    public List<Post> Posts { get; set; } = [];
}

/// <summary>
/// Модель статті автора (Варіант 9: тема, заголовок, текст статті, ілюстрації).
/// </summary>
[Table("posts")]
public class Post
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [Column("topic")]
    public string Topic { get; set; } = string.Empty;

    [Required]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Required]
    [Column("content")]
    public string Content { get; set; } = string.Empty;

    [Column("image_url")]
    public string ImageUrl { get; set; } = string.Empty;

    [ForeignKey(nameof(UserId))]
    public User? Author { get; set; }
}

/// <summary>
/// Контекст бази даних SQLite з автоматичним початковим наповненням (Seeding).
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Post> Posts => Set<Post>();

    /// <summary>
    /// Створює таблиці БД та заповнює їх тестовими даними Варіанта 9, якщо база порожня.
    /// </summary>
    public static void InitializeDatabase(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();

        if (db.Users.Any())
        {
            return;
        }

        var user1 = new User
        {
            Name = "Вівдиченко Максим Сергійович",
            Address = "Київ, вул. Політехнічна, 16",
            Username = "m_vivdychenko",
            Password = "Pass123_Secure"
        };

        var user2 = new User
        {
            Name = "Сергієнко Олена Іванівна",
            Address = "Київ, просп. Берестейський, 37",
            Username = "o_serhienko",
            Password = "AuthorPass456"
        };

        var user3 = new User
        {
            Name = "Коваленко Андрій Петрович",
            Address = "Львів, вул. Університетська, 1",
            Username = "a_kovalenko",
            Password = "LvPass789"
        };

        var user4 = new User
        {
            Name = "Бондаренко Ірина Василівна",
            Address = "Київ, вул. Борщагівська, 126",
            Username = "i_bondarenko",
            Password = "KpiPass321"
        };

        db.Users.AddRange(user1, user2, user3, user4);
        db.SaveChanges();

        db.Posts.AddRange(
            new Post
            {
                UserId = user1.Id,
                Topic = "Web-технології",
                Title = "Створення MCP-серверів на .NET 10",
                Content = "Model Context Protocol (MCP) дозволяє підключати локальні LLM-моделі до баз даних через стандартний інтерфейс інструментів.",
                ImageUrl = "https://images.unsplash.com/photo-1555066931-4365d14bab8c"
            },
            new Post
            {
                UserId = user1.Id,
                Topic = "Бази даних",
                Title = "Робота з SQLite через Entity Framework Core",
                Content = "EF Core забезпечує зручний LINQ-інтерфейс для фільтрації, сортування та агрегації даних без написання сирого SQL.",
                ImageUrl = "https://images.unsplash.com/photo-1544383835-bda2bc66a55d"
            },
            new Post
            {
                UserId = user2.Id,
                Topic = "Інформаційна безпека",
                Title = "Захист облікових записів та JWT-автентифікація",
                Content = "Використання криптографічного хешування паролів та підписаних токенів запобігає несанкціонованому доступу.",
                ImageUrl = "https://images.unsplash.com/photo-1563986768609-322da13575f3"
            },
            new Post
            {
                UserId = user3.Id,
                Topic = "Штучний інтелект",
                Title = "Локальний запуск LLM через LM Studio",
                Content = "Сучасні моделі сімейства Qwen та DeepSeek дозволяють виконувати виклик функцій (Tool Calling) локально на ноутбуці.",
                ImageUrl = "https://images.unsplash.com/photo-1677442136019-21780ecad995"
            },
            new Post
            {
                UserId = user4.Id,
                Topic = "Web-технології",
                Title = "Порівняння REST API та протоколу WebSocket",
                Content = "REST ідеально підходить для CRUD-операцій, тоді як WebSocket забезпечує двосторонній зв'язок у реальному часі.",
                ImageUrl = "https://images.unsplash.com/photo-1461749280684-dccba630e2f6"
            }
        );

        db.SaveChanges();
    }
}
