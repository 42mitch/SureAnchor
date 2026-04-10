using SendGrid;
using SendGrid.Helpers.Mail;

namespace Backend.Services;

public class EmailService
{
    private readonly string _apiKey;
    private readonly string _fromEmail;
    private readonly string _fromName;
    private readonly string _frontendUrl;

    public EmailService(IConfiguration config)
    {
        _apiKey      = config["SendGrid:ApiKey"] ?? throw new InvalidOperationException("SendGrid:ApiKey not configured.");
        _fromEmail   = config["SendGrid:FromEmail"] ?? "sureanchor.admin@gmail.com";
        _fromName    = config["SendGrid:FromName"]  ?? "SureAnchor";
        _frontendUrl = config["App:FrontendUrl"]    ?? "https://zealous-tree-029394910.6.azurestaticapps.net";
    }

    public string FrontendUrl => _frontendUrl;

    private async Task SendAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        var client  = new SendGridClient(_apiKey);
        var from    = new EmailAddress(_fromEmail, _fromName);
        var to      = new EmailAddress(toEmail, toName);
        var msg     = MailHelper.CreateSingleEmail(from, to, subject, null, htmlBody);
        await client.SendEmailAsync(msg);
    }

    // ── Email confirmation ────────────────────────────────────────────────────

    public async Task SendEmailConfirmationAsync(string toEmail, string displayName, string token)
    {
        var encodedToken = Uri.EscapeDataString(token);
        var link = $"{_frontendUrl}/confirm-email?email={Uri.EscapeDataString(toEmail)}&token={encodedToken}";

        var html = $"""
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
              <img src="https://i.imgur.com/placeholder.png" alt="SureAnchor" style="height:40px;margin-bottom:24px;" />
              <h2 style="color:#1B3A5C;margin-bottom:8px;">Confirm your email address</h2>
              <p style="color:#444;line-height:1.6;">Hi {displayName},</p>
              <p style="color:#444;line-height:1.6;">
                Thank you for creating a SureAnchor donor account. Please confirm your email address
                by clicking the button below.
              </p>
              <a href="{link}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#2D8F8A;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">
                Confirm Email Address
              </a>
              <p style="color:#888;font-size:13px;">
                If you didn't create an account, you can safely ignore this email.
                This link expires in 24 hours.
              </p>
              <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
              <p style="color:#aaa;font-size:12px;text-align:center;">
                © {DateTime.UtcNow.Year} SureAnchor · "We have this hope as an anchor for the soul." — Hebrews 6:19
              </p>
            </div>
            """;

        await SendAsync(toEmail, displayName, "Confirm your SureAnchor email address", html);
    }

    // ── Forgot password ───────────────────────────────────────────────────────

    public async Task SendPasswordResetAsync(string toEmail, string displayName, string token)
    {
        var encodedToken = Uri.EscapeDataString(token);
        var link = $"{_frontendUrl}/reset-password?email={Uri.EscapeDataString(toEmail)}&token={encodedToken}";

        var html = $"""
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
              <h2 style="color:#1B3A5C;margin-bottom:8px;">Reset your password</h2>
              <p style="color:#444;line-height:1.6;">Hi {displayName},</p>
              <p style="color:#444;line-height:1.6;">
                We received a request to reset your SureAnchor password.
                Click the button below to choose a new one.
              </p>
              <a href="{link}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#1B3A5C;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">
                Reset Password
              </a>
              <p style="color:#888;font-size:13px;">
                If you didn't request this, you can safely ignore this email.
                This link expires in 1 hour.
              </p>
              <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
              <p style="color:#aaa;font-size:12px;text-align:center;">
                © {DateTime.UtcNow.Year} SureAnchor
              </p>
            </div>
            """;

        await SendAsync(toEmail, displayName, "Reset your SureAnchor password", html);
    }

    // ── Donation confirmation ─────────────────────────────────────────────────

    public async Task SendDonationConfirmationAsync(string toEmail, string displayName, decimal amount, string campaign)
    {
        var html = $"""
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
              <h2 style="color:#1B3A5C;margin-bottom:8px;">Thank you for your donation! 💙</h2>
              <p style="color:#444;line-height:1.6;">Hi {displayName},</p>
              <p style="color:#444;line-height:1.6;">
                Your generous donation of <strong>₱{amount:N2}</strong> to the
                <strong>{campaign}</strong> has been received.
                Your support helps provide safety, healing, and hope for young women who need it most.
              </p>
              <div style="background:#f0f9f9;border-left:4px solid #2D8F8A;padding:16px 20px;border-radius:0 10px 10px 0;margin:24px 0;">
                <p style="margin:0;color:#1B3A5C;font-style:italic;line-height:1.6;">
                  "We have this hope as an anchor for the soul, firm and secure." — Hebrews 6:19
                </p>
              </div>
              <p style="color:#444;line-height:1.6;">
                You can view your full donation history anytime in your
                <a href="{_frontendUrl}/donor" style="color:#2D8F8A;">donor portal</a>.
              </p>
              <p style="color:#444;">With gratitude,<br/><strong>The SureAnchor Team</strong></p>
              <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
              <p style="color:#aaa;font-size:12px;text-align:center;">
                © {DateTime.UtcNow.Year} SureAnchor · Protecting and restoring young women.
              </p>
            </div>
            """;

        await SendAsync(toEmail, displayName, "Thank you for your donation to SureAnchor! 💙", html);
    }

    // ── Contact form notification ─────────────────────────────────────────────

    public async Task SendContactNotificationAsync(string senderName, string senderEmail, string topic, string message)
    {
        var adminEmail = _fromEmail; // notify the same admin inbox
        var html = $"""
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
              <h2 style="color:#1B3A5C;">New contact message on SureAnchor</h2>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <tr><td style="padding:8px 0;color:#888;width:120px;">From</td><td style="padding:8px 0;color:#222;font-weight:600;">{senderName}</td></tr>
                <tr><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;"><a href="mailto:{senderEmail}" style="color:#2D8F8A;">{senderEmail}</a></td></tr>
                <tr><td style="padding:8px 0;color:#888;">Topic</td><td style="padding:8px 0;color:#222;">{topic ?? "Not specified"}</td></tr>
              </table>
              <div style="background:#f9f9f9;border:1px solid #eee;border-radius:10px;padding:16px 20px;margin:16px 0;">
                <p style="margin:0;color:#444;line-height:1.6;white-space:pre-wrap;">{message}</p>
              </div>
              <a href="mailto:{senderEmail}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#1B3A5C;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">
                Reply to {senderName}
              </a>
              <p style="color:#888;font-size:13px;">
                View all messages in the
                <a href="{_frontendUrl}/admin/messages" style="color:#2D8F8A;">admin messages page</a>.
              </p>
            </div>
            """;

        await SendAsync(adminEmail, "SureAnchor Admin", $"New message from {senderName} — SureAnchor", html);
    }

    // ── Email change confirmation ──────────────────────────────────────────────

    public async Task SendEmailChangeConfirmationAsync(string newEmail, string displayName, string token)
    {
        var encodedToken = Uri.EscapeDataString(token);
        var link = $"{_frontendUrl}/confirm-email?email={Uri.EscapeDataString(newEmail)}&token={encodedToken}&change=true";

        var html = $"""
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
              <h2 style="color:#1B3A5C;margin-bottom:8px;">Confirm your new email address</h2>
              <p style="color:#444;line-height:1.6;">Hi {displayName},</p>
              <p style="color:#444;line-height:1.6;">
                Click below to confirm <strong>{newEmail}</strong> as your new SureAnchor email address.
              </p>
              <a href="{link}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#2D8F8A;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">
                Confirm New Email
              </a>
              <p style="color:#888;font-size:13px;">
                If you didn't request this change, please contact us immediately at sureanchor.admin@gmail.com.
                This link expires in 24 hours.
              </p>
            </div>
            """;

        await SendAsync(newEmail, displayName, "Confirm your new SureAnchor email address", html);
    }
}