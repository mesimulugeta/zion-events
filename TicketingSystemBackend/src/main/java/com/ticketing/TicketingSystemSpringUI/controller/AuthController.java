package com.ticketing.TicketingSystemSpringUI.controller;

import com.ticketing.TicketingSystemSpringUI.config.JwtUtil;
import com.ticketing.TicketingSystemSpringUI.domain.User;
import com.ticketing.TicketingSystemSpringUI.repository.UserRepository;
import com.ticketing.TicketingSystemSpringUI.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private static final int CODE_EXPIRY_MINUTES = 10;
    private static final int TWO_FA_CODE_EXPIRY_MINUTES = 5;
    private static final int RESET_CODE_EXPIRY_MINUTES = 10;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          AuthenticationManager authenticationManager,
                          JwtUtil jwtUtil,
                          EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        Optional<User> existingByUsername = userRepository.findByUsername(user.getUsername());
        if (existingByUsername.isPresent() && existingByUsername.get().isVerified()) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Username already taken"));
        }

        Optional<User> existingByEmail = userRepository.findByEmail(user.getEmail());
        if (existingByEmail.isPresent() && existingByEmail.get().isVerified()) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email already registered"));
        }

        if (existingByEmail.isPresent() && !existingByEmail.get().isVerified()) {
            User pending = existingByEmail.get();
            String code = generateCode();
            pending.setVerificationCode(code);
            pending.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(CODE_EXPIRY_MINUTES));

            userRepository.save(pending);
            sendVerificationEmailSafely(pending, code);

            return ResponseEntity.ok(Map.of(
                    "message", "An unverified account already exists for this email. We've sent a new verification code.",
                    "email", pending.getEmail()
            ));
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole("USER");
        user.setVerified(false);
        String code = generateCode();
        user.setVerificationCode(code);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(CODE_EXPIRY_MINUTES));

        userRepository.save(user);
        sendVerificationEmailSafely(user, code);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Registration successful. Please check your email for a verification code.",
                "email", user.getEmail()
        ));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyEmail(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "No account found for this email"));
        }

        if (user.isVerified()) {
            String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "username", user.getUsername(),
                    "email", user.getEmail(),
                    "role", user.getRole()
            ));
        }

        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(code)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid verification code"));
        }

        if (user.getVerificationCodeExpiry() == null || user.getVerificationCodeExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Verification code has expired. Please request a new one."));
        }

        user.setVerified(true);
        user.setVerificationCode(null);
        user.setVerificationCodeExpiry(null);

        userRepository.save(user);

        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getUsername());
            log.info("Welcome email sent to {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}: {}", user.getEmail(), e.getMessage(), e);
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

        return ResponseEntity.ok(Map.of(
                "token", token,
                "username", user.getUsername(),
                "email", user.getEmail(),
                "role", user.getRole()
        ));
    }

    @PostMapping("/resend-code")
    public ResponseEntity<?> resendCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "No account found for this email"));
        }

        if (user.isVerified()) {
            return ResponseEntity.ok(Map.of("message", "Email already verified. You can log in."));
        }

        String code = generateCode();
        user.setVerificationCode(code);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(CODE_EXPIRY_MINUTES));

        userRepository.save(user);

        sendVerificationEmailSafely(user, code);

        return ResponseEntity.ok(Map.of("message", "A new verification code has been sent to your email."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        try {
            // Throws AuthenticationException when the credentials are wrong
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );

            User user = userRepository.findByUsername(username).orElseThrow();

            if (!user.isVerified()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "error", "Please verify your email before logging in.",
                        "email", user.getEmail()
                ));
            }

            if ("ADMIN".equalsIgnoreCase(user.getRole()) && user.isTwoFactorEnabled()) {
                String code = generateCode();
                userRepository.updateTwoFactorCode(user.getId(), code,
                        LocalDateTime.now().plusMinutes(TWO_FA_CODE_EXPIRY_MINUTES));

                try {
                    emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), code);
                } catch (Exception e) {
                    log.error("Failed to send 2FA code to {}: {}", user.getEmail(), e.getMessage(), e);
                }

                return ResponseEntity.ok(Map.of(
                        "requires2FA", true,
                        "username", user.getUsername()
                ));
            }

            String token = jwtUtil.generateToken(username, user.getRole());

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "username", username,
                    "email", user.getEmail(),
                    "role", user.getRole()
            ));
        } catch (AuthenticationException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid username or password"));
        }
    }

    @PostMapping("/2fa/verify")
    public ResponseEntity<?> verifyTwoFactor(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String code = body.get("code");

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "No account found"));
        }

        if (user.getTwoFactorCode() == null || !user.getTwoFactorCode().equals(code)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid verification code"));
        }

        if (user.getTwoFactorCodeExpiry() == null || user.getTwoFactorCodeExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Verification code has expired. Please log in again."));
        }

        userRepository.clearTwoFactorCode(user.getId());

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

        return ResponseEntity.ok(Map.of(
                "token", token,
                "username", user.getUsername(),
                "email", user.getEmail(),
                "role", user.getRole()
        ));
    }


    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        User user = userRepository.findByUsername(username).orElse(null);

        if (user == null) {
            return ResponseEntity.ok(Map.of(
                    "message", "If that username exists, a reset code has been sent."
            ));
        }

        String code = generateCode();
        userRepository.updateResetCode(user.getId(), code,
                LocalDateTime.now().plusMinutes(RESET_CODE_EXPIRY_MINUTES));

        try {
            emailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), code);
        } catch (Exception e) {
            log.error("Failed to send reset email: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not send email. Please try again later."));
        }

        String maskedEmail = maskEmail(user.getEmail());

        return ResponseEntity.ok(Map.of(
                "message", "We've sent a reset code to your email: " + maskedEmail,
                "maskedEmail", maskedEmail,
                "username", user.getUsername()
        ));
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<?> verifyResetCode(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String code = body.get("code");

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "No account found for that username."));
        }

        if (user.getResetCode() == null || !user.getResetCode().equals(code)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid reset code. Please check and try again."));
        }

        if (user.getResetCodeExpiry() == null || user.getResetCodeExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Reset code has expired. Please request a new one."));
        }

        return ResponseEntity.ok(Map.of("message", "Code verified successfully."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String code = body.get("code");
        String newPassword = body.get("newPassword");

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "No account found for that username."));
        }

        if (user.getResetCode() == null || !user.getResetCode().equals(code)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid reset code. Please request a new one."));
        }
        if (user.getResetCodeExpiry() == null || user.getResetCodeExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Reset code has expired. Please request a new one."));
        }

        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "New password must be different from your current password."));
        }

        String passwordError = validatePassword(newPassword);
        if (passwordError != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", passwordError));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.updatePassword(user.getId(), user.getPassword());
        userRepository.clearResetCode(user.getId());

        return ResponseEntity.ok(Map.of(
                "message", "Your password has been reset successfully. You can now log in."
        ));
    }

    private String generateCode() {
        int code = secureRandom.nextInt(1_000_000);
        return String.format("%06d", code);
    }

    private void sendVerificationEmailSafely(User user, String code) {
        try {
            emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), code);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", user.getEmail(), e.getMessage(), e);
        }
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        String[] parts = email.split("@");
        String local = parts[0];
        String domain = parts[1];
        if (local.length() <= 2) {
            return local + "***@" + domain;
        }
        return local.charAt(0) + "***" + local.charAt(local.length() - 1) + "@" + domain;
    }

    private String validatePassword(String password) {
        if (password.length() < 6) {
            return "Password must be at least 6 characters long.";
        }
        boolean hasLetter = password.matches(".*[a-zA-Z].*");
        boolean hasDigit = password.matches(".*\\d.*");
        boolean hasSpecial = password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*");
        if (!hasLetter || !hasDigit || !hasSpecial) {
            return "Password must contain at least one letter, one number, and one special character.";
        }
        return null;
    }
}