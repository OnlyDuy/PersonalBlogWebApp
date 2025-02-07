using PersonalBlogWebApp.Models;

namespace PersonalBlogWebApp.UtilityService
{
    public interface IEmailService
    {
        void SendEmail(EmailModel emailModel);
    }
}
