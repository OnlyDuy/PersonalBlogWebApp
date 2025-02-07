using PersonalBlogWebApp.Models;
using Microsoft.EntityFrameworkCore;

namespace PersonalBlogWebApp.DBContext
{
    public class BlogWebAppDbContext : DbContext
    {
        public BlogWebAppDbContext(DbContextOptions<BlogWebAppDbContext> options) : base(options)
        {

        }

        public DbSet<User> Users { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>().ToTable("users");
        }
    }
}
