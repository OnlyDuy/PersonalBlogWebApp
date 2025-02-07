using System.ComponentModel.DataAnnotations;

namespace PersonalBlogWebApp.Models
{
    public class User
    {
        [Key]
        public int UserId { get; set; }
        public string? Username { get; set; }
        public string? DisplayName { get; set; }
        public string? Email { get; set; }
        public string? ProfilePicture { get; set; } = "default.jpg"; // Optional
        public string? Role { get; set; }
        public string? PasswordHash { get; set; }
        public string? Token { get; set; }
        public string? RefreshToken { get; set; } // Token dùng để làm mới JWT
        public DateTime? RefreshTokenExpiryTime { get; set; } // Thời hạn của Refresh Token
        public string? ResetPasswordToken { get; set; }
        public DateTime ResetPasswordExpiry { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdateAt { get; set; }
        public bool? IsActive { get; set; }
    }
}
