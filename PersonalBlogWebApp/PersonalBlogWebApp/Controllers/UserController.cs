using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PersonalBlogWebApp.DBContext;
using PersonalBlogWebApp.Helpers;
using PersonalBlogWebApp.Models;
using PersonalBlogWebApp.Models.Dtos;
using PersonalBlogWebApp.UtilityService;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace PersonalBlogWebApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly BlogWebAppDbContext _blogWebAppDbContext;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public UserController(BlogWebAppDbContext blogWebAppDbContext, IConfiguration configuration, IEmailService emailService)
        {
            _blogWebAppDbContext = blogWebAppDbContext;
            _configuration = configuration;
            _emailService = emailService;
        }

        [HttpPost("authenticate")]
        public async Task<IActionResult> Authenticate([FromBody] User userObj)
        {
            if (userObj == null)
                return BadRequest();

            var user = await _blogWebAppDbContext.Users.FirstOrDefaultAsync(x => x.Username == userObj.Username);
            if (user == null)
                return NotFound(new { Message = "User not found" });
            if (!PasswordHasher.VerifyPassword(userObj.PasswordHash, user.PasswordHash))
            {
                return BadRequest(new { Message = "PasswordHash is Incorrect" });
            }

            user.Token = CreateJwt(user);
            var newAccessToken = user.Token;
            var newRefreshToken = CreateRefreshToken();
            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.Now.AddDays(5);
            await _blogWebAppDbContext.SaveChangesAsync();

            return Ok(new TokenApiDto()
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken
            });
        }

        private string CreateRefreshToken()
        {
            var tokenBytes = RandomNumberGenerator.GetBytes(64);
            var refreshToken = Convert.ToBase64String(tokenBytes);

            var tokenInUser = _blogWebAppDbContext.Users
                .Any(a => a.RefreshToken == refreshToken);
            if (tokenInUser)
            {
                return CreateRefreshToken();
            }

            return refreshToken;
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterUser([FromBody] User userObj)
        {
            if (userObj == null)
                return BadRequest();

            // check username
            if (await CheckUserNameExistAsync(userObj.Username))
                return BadRequest("Username already exist");
            // check email
            if (await CheckEmailExistAsync(userObj.Email))
                return BadRequest("Email already exist");
            // check password Strength
            var pass = CheckPasswordStrengthAsync(userObj.PasswordHash);
            if (!string.IsNullOrEmpty(pass))
                return BadRequest(new { Message = pass.ToString() });

            userObj.PasswordHash = PasswordHasher.HashPassword(userObj.PasswordHash);
            userObj.Role = "User";
            userObj.Token = "";
            userObj.CreatedAt = DateTime.Now;
            userObj.UpdateAt = DateTime.Now;
            userObj.IsActive = true;

            await _blogWebAppDbContext.AddAsync(userObj);
            await _blogWebAppDbContext.SaveChangesAsync();
            return Ok(new
            {
                Message = "User Register!"
            });
        }

        [Authorize]
        [HttpGet]
        public async Task<ActionResult<User>> GetAllUsers()
        {
            return Ok(await _blogWebAppDbContext.Users.ToListAsync());
        }

        private async Task<bool> CheckUserNameExistAsync(string username)
        {
            return await _blogWebAppDbContext.Users.AnyAsync(x => x.Username == username);
        }
        private async Task<bool> CheckEmailExistAsync(string email)
        {
            return await _blogWebAppDbContext.Users.AnyAsync(x => x.Email == email);
        }
        private string CheckPasswordStrengthAsync(string password)
        {
            StringBuilder sb = new StringBuilder();
            if (password.Length < 9)
            {
                sb.Append("Minimun password length should be 8" + Environment.NewLine);
            }
            if (!password.Any(char.IsUpper))
            {
                sb.Append("Password must contain at least one uppercase letter" + Environment.NewLine);
            }

            if (!password.Any(char.IsLower))
            {
                sb.Append("Password must contain at least one lowercase letter" + Environment.NewLine);
            }

            if (!password.Any(char.IsDigit))
            {
                sb.Append("Password must contain at least one number" + Environment.NewLine);
            }

            if (!password.Any(char.IsPunctuation))
            {
                sb.Append("Password must contain at least one special character" + Environment.NewLine);
            }
            return sb.ToString();
        }

        private string CreateJwt(User user)
        {
            var jwtTokenHandle = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes("veryverysecret.....veryverysecret.....");
            var identity = new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(ClaimTypes.Name, $"{user.Username}")
            });

            var credentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = identity,
                //Expires = DateTime.Now.AddDays(1),
                Expires = DateTime.Now.AddSeconds(10),
                SigningCredentials = credentials
            };

            var token = jwtTokenHandle.CreateToken(tokenDescriptor);
            return jwtTokenHandle.WriteToken(token);
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] TokenApiDto tokenApiDto)
        {
            // Xử lý cung cấp mã thông bao giao dịch mới
            if (tokenApiDto is null)
                return BadRequest("Invalid Client Request");
            string accessToken = tokenApiDto.AccessToken;
            string refreshToken = tokenApiDto.RefreshToken;
            var principal = GetPrincipleFromExpiredToken(accessToken);
            var username = principal.Identity.Name;
            var user = await _blogWebAppDbContext.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user is null || user.RefreshToken != refreshToken || user.RefreshTokenExpiryTime <= DateTime.Now)
                return BadRequest("Invalid Request");
            var newAccessToken = CreateJwt(user);
            var newRefreshToken = CreateRefreshToken();
            user.RefreshToken = newRefreshToken;
            await _blogWebAppDbContext.SaveChangesAsync();
            return Ok(new TokenApiDto()
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
            });
        }

        private ClaimsPrincipal GetPrincipleFromExpiredToken(string token)
        {
            var key = Encoding.ASCII.GetBytes("veryverysecret.....veryverysecret.....");
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = false
            };
            var tokenHandler = new JwtSecurityTokenHandler();
            SecurityToken securityToken;
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out securityToken);
            var jwtSecurityToken = securityToken as JwtSecurityToken;
            if (jwtSecurityToken == null || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                throw new SecurityTokenException("This is Invalid Token");
            return principal;
        }

        [HttpPost("send-reset-email/{email}")]
        public async Task<IActionResult> SendEmail(string email)
        {
            var user = await _blogWebAppDbContext.Users.FirstOrDefaultAsync(a => a.Email == email);
            if (user is null)
            {
                return NotFound(new
                {
                    StatusCode = 404,
                    Message = "email Doesn't Exist"
                });
            }

            var tokenBytes = RandomNumberGenerator.GetBytes(64);
            var emailToken = Convert.ToBase64String(tokenBytes);
            user.ResetPasswordToken = emailToken;
            user.ResetPasswordExpiry = DateTime.Now.AddMinutes(15);
            string from = _configuration["EmailSettings:From"];
            var emailModel = new EmailModel(email, "Reset Password!!", EmailBody.EmailStringBody(email, emailToken));
            _emailService.SendEmail(emailModel);
            _blogWebAppDbContext.Entry(user).State = EntityState.Modified;
            await _blogWebAppDbContext.SaveChangesAsync();
            return Ok(new
            {
                StatusCode = 200,
                Message = "Email Sent!"
            });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto resetPasswordDto)
        {
            var newToken = resetPasswordDto.EmailToken.Replace(" ", "+");
            var user = await _blogWebAppDbContext.Users.AsNoTracking().FirstOrDefaultAsync(a => a.Email == resetPasswordDto.Email);
            if (user is null)
            {
                return NotFound(new
                {
                    StatusCode = 404,
                    Message = "User Doesn't Exist"
                });
            }

            var tokenCode = user.ResetPasswordToken;
            DateTime emailTokenExpiry = user.ResetPasswordExpiry;
            if (tokenCode != resetPasswordDto.EmailToken || emailTokenExpiry < DateTime.Now)
            {
                return BadRequest(new
                {
                    StatusCode = 400,
                    Message = "Invalid Reset Link"
                });
            }
            user.PasswordHash = PasswordHasher.HashPassword(resetPasswordDto.NewPassword);
            _blogWebAppDbContext.Entry(user).State = EntityState.Modified;
            await _blogWebAppDbContext.SaveChangesAsync();

            return Ok(new
            {
                StatusCode = 200,
                Message = "Password Reset Successfully"
            });
        }
    }
}
