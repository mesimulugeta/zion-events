package com.ticketing.TicketingSystemSpringUI.service;

import com.ticketing.TicketingSystemSpringUI.domain.Event;
import com.ticketing.TicketingSystemSpringUI.domain.Seat;
import jakarta.annotation.PostConstruct;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    private static final DateTimeFormatter TICKET_DATE_FMT =
            DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy");
    private static final DateTimeFormatter TICKET_TIME_FMT =
            DateTimeFormatter.ofPattern("h:mm a");

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @PostConstruct
    public void init() {
        if (fromEmail == null || fromEmail.isEmpty()) {
            log.error("⚠️ spring.mail.username is not set! Emails will fail.");
        } else {
            log.info("📧 Email sender configured: {}", fromEmail);
        }
    }

    private String getFromEmail() {
        if (fromEmail == null || fromEmail.isEmpty()) {
            log.warn("spring.mail.username not set – using fallback 'noreply@zionevents.com'");
            return "noreply@zionevents.com";
        }
        return fromEmail;
    }

    public void sendEventTicket(String toEmail, String userName, Event event, Seat seat,
                                 String reservationId, int ticketIndex, int totalTickets) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String ticketCode = "RES-" + reservationId + "-SEAT-" + seat.getId();

            helper.setFrom(getFromEmail());
            helper.setTo(toEmail);
            helper.setSubject("🎫 Your Ticket – " + event.getTitle() + " (Seat " + seat.getId() + ")");

            String dateStr = event.getStartAt() != null ? event.getStartAt().format(TICKET_DATE_FMT) : "TBA";
            String timeStr = event.getStartAt() != null ? event.getStartAt().format(TICKET_TIME_FMT) : "TBA";
            String venue = event.getVenueName() != null ? event.getVenueName() : "Main Hall";
            String price = event.getPrice() != null ? event.getPrice().stripTrailingZeros().toPlainString() : "0";

            String qrData = URLEncoder.encode(ticketCode, StandardCharsets.UTF_8);
            String qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=" + qrData;

            String html = """
                <!DOCTYPE html>
                <html>
                <head>
                <style>
                  body { font-family: Arial, Helvetica, sans-serif; background:#f2f2f2; margin:0; padding:0; }
                  .wrapper { max-width:600px; margin:30px auto; padding:0 10px; }
                  .brand { text-align:center; margin-bottom:16px; }
                  .brand h1 { color:#0097a7; font-size:22px; margin:0; letter-spacing:1px; }
                  .ticket { background:#ffffff; border-radius:14px; overflow:hidden;
                            box-shadow:0 6px 18px rgba(0,0,0,0.12); border:1px solid #e0e0e0; }
                  .ticket-header { background:linear-gradient(135deg,#00acc1,#007c8a); color:#ffffff;
                                    padding:18px 24px; }
                  .ticket-header .event-title { font-size:20px; font-weight:700; margin:0 0 4px 0; }
                  .ticket-header .event-sub { font-size:13px; opacity:0.9; margin:0; }
                  .ticket-body { display:table; width:100%%; table-layout:fixed; }
                  .main-info { display:table-cell; padding:20px 24px; vertical-align:top; }
                  .stub { display:table-cell; width:180px; padding:20px; text-align:center;
                          vertical-align:top; border-left:2px dashed #cccccc; background:#fafafa; }
                  .info-row { margin-bottom:12px; }
                  .info-label { font-size:11px; text-transform:uppercase; letter-spacing:0.5px;
                                color:#888888; margin:0 0 2px 0; }
                  .info-value { font-size:15px; color:#222222; font-weight:600; margin:0; }
                  .qr-code { border-radius:8px; }
                  .ticket-code { font-family:'Courier New', monospace; font-size:12px;
                                 color:#555555; margin-top:10px; letter-spacing:1px; word-break:break-all; }
                  .ticket-index { display:inline-block; margin-top:8px; background:#0097a7; color:#fff;
                                   font-size:11px; padding:3px 10px; border-radius:12px; font-weight:600; }
                  .footer-strip { background:#f5f5f5; padding:14px 24px; font-size:12px; color:#777777;
                                   text-align:center; border-top:1px solid #eeeeee; }
                  .price-tag { display:inline-block; margin-top:6px; font-size:16px; font-weight:700; color:#0097a7; }
                </style>
                </head>
                <body>
                <div class="wrapper">
                  <div class="brand">
                    <h1>ZION EVENTS</h1>
                  </div>

                  <div class="ticket">
                    <div class="ticket-header">
                      <p class="event-title">%s</p>
                      <p class="event-sub">%s &nbsp;•&nbsp; %s</p>
                    </div>

                    <div class="ticket-body">
                      <div class="main-info">
                        <div class="info-row">
                          <p class="info-label">Attendee</p>
                          <p class="info-value">%s</p>
                        </div>
                        <div class="info-row">
                          <p class="info-label">Venue</p>
                          <p class="info-value">%s</p>
                        </div>
                        <div class="info-row">
                          <p class="info-label">Date</p>
                          <p class="info-value">%s</p>
                        </div>
                        <div class="info-row">
                          <p class="info-label">Time</p>
                          <p class="info-value">%s</p>
                        </div>
                        <div class="info-row">
                          <p class="info-label">Reservation ID</p>
                          <p class="info-value">#%s</p>
                        </div>
                        <span class="price-tag">%s ETB</span>
                      </div>

                      <div class="stub">
                        <p class="info-label">Seat</p>
                        <p class="info-value" style="font-size:22px;">%s</p>
                        <p class="info-label" style="margin-top:10px;">Section</p>
                        <p class="info-value">%s</p>
                        <img class="qr-code" src="%s" alt="QR Code" width="120" height="120" />
                        <div class="ticket-code">%s</div>
                        <div class="ticket-index">Ticket %d of %d</div>
                      </div>
                    </div>

                    <div class="footer-strip">
                      Please present this ticket (printed or on your phone) at entry.<br>
                      This ticket is valid for one seat only. Non-transferable unless authorized by Zion Events.
                    </div>
                  </div>

                  <p style="text-align:center;color:#999999;font-size:12px;margin-top:16px;">
                    Need help? Contact Zion Events support. See you at the event! 🎉
                  </p>
                </div>
                </body>
                </html>
                """.formatted(
                    event.getTitle(),
                    dateStr,
                    timeStr,
                    userName,
                    venue,
                    dateStr,
                    timeStr,
                    reservationId,
                    price,
                    String.valueOf(seat.getId()),
                    seat.getSection() != null ? seat.getSection() : "—",
                    qrUrl,
                    ticketCode,
                    ticketIndex,
                    totalTickets
                );

            helper.setText(html, true);
            mailSender.send(message);
            log.info(" Ticket email sent to {} for seat {} (reservation {})", toEmail, seat.getId(), reservationId);
        } catch (Exception e) {
            log.error(" Failed to send ticket email to {} for seat {}: {}", toEmail, seat.getId(), e.getMessage(), e);
        }
    }

    public void sendReservationConfirmation(String toEmail, String userName, Event event,
                                            List<Seat> seats, String reservationId) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getFromEmail());
            helper.setTo(toEmail);
            helper.setSubject("🎟️ Reservation Confirmed – " + event.getTitle());

            String seatNumbers = seats.stream()
                    .map(s -> "Seat " + s.getId() + " (" + s.getSection() + ")")
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("None");

            String html = """
                <!DOCTYPE html>
                <html>
                <head><style>body{font-family:Arial;color:#333;}</style></head>
                <body>
                <div style="max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:10px;">
                    <h2 style="color:#0097a7;">✅ Reservation Confirmed!</h2>
                    <p>Dear <strong>%s</strong>,</p>
                    <p>Your reservation for "<strong>%s</strong>" has been successfully confirmed.</p>
                    <h3>Reservation Details:</h3>
                    <p><strong>Reservation ID:</strong> %s</p>
                    <p><strong>Event:</strong> %s</p>
                    <p><strong>Date & Time:</strong> %s</p>
                    <p><strong>Venue:</strong> %s</p>
                    <p><strong>Seats:</strong> %s</p>
                    <p><strong>Total Amount:</strong> %s ETB</p>
                    <br>
                    <p>We look forward to seeing you at the event!</p>
                    <p>Best regards,<br>Zion Events Team</p>
                </div>
                </body>
                </html>
                """.formatted(
                    userName,
                    event.getTitle(),
                    reservationId,
                    event.getTitle(),
                    event.getStartAt(),
                    event.getVenueName() != null ? event.getVenueName() : "Main Hall",
                    seatNumbers,
                    event.getPrice() != null ? event.getPrice() : "0"
                );

            helper.setText(html, true);
            mailSender.send(message);
            log.info(" Confirmation email sent to {}", toEmail);
        } catch (Exception e) {
            log.error(" Failed to send confirmation email to {}: {}", toEmail, e.getMessage(), e);
        }
    }

    public void sendReservationCancellation(String toEmail, String userName, Event event,
                                            String reservationId, boolean cancelledByAdmin) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getFromEmail());
            helper.setTo(toEmail);
            helper.setSubject(" Reservation Cancelled – " + event.getTitle());

            String reasonLine = cancelledByAdmin
                    ? "Your reservation was cancelled by an administrator."
                    : "You have successfully cancelled this reservation.";

            String html = """
                <div style="max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:10px;">
                    <h2 style="color:#dc3545;">Reservation Cancelled</h2>
                    <p>Dear %s,</p>
                    <p>Your reservation (ID: %s) for "<strong>%s</strong>" has been cancelled.</p>
                    <p>%s</p>
                    <p>If you did not request this cancellation, please contact support immediately.</p>
                    <br>
                    <p>Best regards,<br>Zion Events Team</p>
                </div>
                """.formatted(userName, reservationId, event.getTitle(), reasonLine);

            helper.setText(html, true);
            mailSender.send(message);
            log.info(" Cancellation email sent to {}", toEmail);
        } catch (Exception e) {
            log.error(" Failed to send cancellation email to {}: {}", toEmail, e.getMessage(), e);
        }
    }

    public void sendWelcomeEmail(String toEmail, String userName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getFromEmail());
            helper.setTo(toEmail);
            helper.setSubject("Welcome to Zion Events! 🎉");

            String html = """
                <div style="max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:10px;">
                    <h2 style="color:#0097a7;">Welcome to Zion Events!</h2>
                    <p>Dear %s,</p>
                    <p>Thank you for registering with Zion Events – your gateway to unforgettable moments in Ethiopia.</p>
                    <p>Start exploring amazing events and book your seats now!</p>
                    <br>
                    <p>Best regards,<br>Zion Events Team</p>
                </div>
                """.formatted(userName);

            helper.setText(html, true);
            mailSender.send(message);
            log.info(" Welcome email sent to {}", toEmail);
        } catch (Exception e) {
            log.error(" Failed to send welcome email to {}: {}", toEmail, e.getMessage(), e);
        }
    }

    public void sendVerificationEmail(String toEmail, String userName, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getFromEmail());
            helper.setTo(toEmail);
            helper.setSubject("Verify your email – Zion Events");

            String html = """
                <div style="max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:10px;">
                    <h2 style="color:#0097a7;">Confirm your email</h2>
                    <p>Dear %s,</p>
                    <p>Thanks for signing up with Zion Events. Use the verification code below to activate your account:</p>
                    <h1 style="text-align:center;letter-spacing:8px;color:#0097a7;">%s</h1>
                    <p>This code expires in 10 minutes. If you didn't create this account, you can safely ignore this email.</p>
                    <br>
                    <p>Best regards,<br>Zion Events Team</p>
                </div>
                """.formatted(userName, code);

            helper.setText(html, true);
            mailSender.send(message);
            log.info(" Verification email sent to {}", toEmail);
        } catch (Exception e) {
            log.error(" Failed to send verification email to {}: {}", toEmail, e.getMessage(), e);
        }
    }

    public void sendPasswordResetEmail(String toEmail, String userName, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(getFromEmail());
            helper.setTo(toEmail);
            helper.setSubject("🔐 Reset your password – Zion Events");

            String html = """
                <div style="max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:10px;">
                    <h2 style="color:#0097a7;">Reset Your Password</h2>
                    <p>Dear %s,</p>
                    <p>We received a request to reset your password. Use the code below:</p>
                    <h1 style="text-align:center;letter-spacing:8px;color:#0097a7;">%s</h1>
                    <p>This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
                    <br>
                    <p>Best regards,<br>Zion Events Team</p>
                </div>
                """.formatted(userName, code);

            helper.setText(html, true);
            mailSender.send(message);
            log.info(" Password reset email sent to {}", toEmail);
        } catch (Exception e) {
            log.error(" Failed to send reset email to {}: {}", toEmail, e.getMessage(), e);
        }
    }
}