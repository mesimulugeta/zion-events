package com.ticketing.TicketingSystemSpringUI.repository;

import com.ticketing.TicketingSystemSpringUI.domain.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.Timestamp;
import java.util.Optional;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<User> rowMapper = (rs, rowNum) -> {
        User user = new User();
        user.setId(rs.getLong("id"));
        user.setUsername(rs.getString("username"));
        user.setEmail(rs.getString("email"));
        user.setPassword(rs.getString("password"));
        user.setFullName(rs.getString("full_name"));
        user.setRole(rs.getString("role"));

        try { user.setVerified(rs.getBoolean("verified")); } catch (Exception e) { user.setVerified(false); }
        try { user.setVerificationCode(rs.getString("verification_code")); } catch (Exception e) { }
        try {
            Timestamp expiryTimestamp = rs.getTimestamp("verification_code_expiry");
            if (expiryTimestamp != null) {
                user.setVerificationCodeExpiry(expiryTimestamp.toLocalDateTime());
            }
        } catch (Exception e) { }

        try { user.setPhoneNumber(rs.getString("phone_number")); } catch (Exception e) { }
        try {
            Date dob = rs.getDate("date_of_birth");
            if (dob != null) user.setDateOfBirth(dob.toLocalDate());
        } catch (Exception e) { }
        try { user.setProfilePicUrl(rs.getString("profile_pic_url")); } catch (Exception e) { }
        try {
            String theme = rs.getString("theme");
            if (theme != null) user.setTheme(theme);
        } catch (Exception e) { }
        try {
            String language = rs.getString("language");
            if (language != null) user.setLanguage(language);
        } catch (Exception e) { }
        try { user.setActive(rs.getBoolean("active")); } catch (Exception e) { user.setActive(true); }
        try { user.setTwoFactorEnabled(rs.getBoolean("two_factor_enabled")); } catch (Exception e) { }
        try { user.setTwoFactorSecret(rs.getString("two_factor_secret")); } catch (Exception e) { }
        try { user.setTwoFactorCode(rs.getString("two_factor_code")); } catch (Exception e) { }
        try {
            Timestamp twoFAExpiry = rs.getTimestamp("two_factor_code_expiry");
            if (twoFAExpiry != null) user.setTwoFactorCodeExpiry(twoFAExpiry.toLocalDateTime());
        } catch (Exception e) { }

        try { user.setResetCode(rs.getString("reset_code")); } catch (Exception e) { }
        try {
            Timestamp resetExpiry = rs.getTimestamp("reset_code_expiry");
            if (resetExpiry != null) user.setResetCodeExpiry(resetExpiry.toLocalDateTime());
        } catch (Exception e) { }

        return user;
    };

    public Optional<User> findByUsername(String username) {
        try {
            String sql = "SELECT * FROM users WHERE username = ?";
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, rowMapper, username));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public Optional<User> findByEmail(String email) {
        try {
            String sql = "SELECT * FROM users WHERE email = ?";
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, rowMapper, email));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public Optional<User> findById(Long id) {
        try {
            String sql = "SELECT * FROM users WHERE id = ?";
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, rowMapper, id));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public void save(User user) {
        Optional<User> existingUser = findByEmail(user.getEmail());

        if (existingUser.isPresent()) {
            try {
                String sql = "UPDATE users SET verification_code = ?, verification_code_expiry = ?, verified = ?, role = ? WHERE email = ?";
                jdbcTemplate.update(sql,
                        user.getVerificationCode(),
                        user.getVerificationCodeExpiry() != null ? Timestamp.valueOf(user.getVerificationCodeExpiry()) : null,
                        user.isVerified(),
                        user.getRole() == null ? "USER" : user.getRole(),
                        user.getEmail()
                );
            } catch (Exception e) {
                System.out.println("⚠️ Verification columns missing during UPDATE. Falling back to simple update.");
                String sql = "UPDATE users SET role = ? WHERE email = ?";
                jdbcTemplate.update(sql, user.getRole() == null ? "USER" : user.getRole(), user.getEmail());
            }
        } else {
            try {
                String sql = "INSERT INTO users (username, email, password, full_name, role, verification_code, verification_code_expiry, verified, created_at) " +
                             "VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
                jdbcTemplate.update(sql,
                        user.getUsername(),
                        user.getEmail(),
                        user.getPassword(),
                        user.getFullName(),
                        user.getRole() == null ? "USER" : user.getRole(),
                        user.getVerificationCode(),
                        user.getVerificationCodeExpiry() != null ? Timestamp.valueOf(user.getVerificationCodeExpiry()) : null,
                        user.isVerified()
                );
            } catch (Exception e) {
                System.out.println("⚠️ Verification columns missing during INSERT. Falling back to original query.");
                String sql = "INSERT INTO users (username, email, password, full_name, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())";
                jdbcTemplate.update(sql,
                        user.getUsername(),
                        user.getEmail(),
                        user.getPassword(),
                        user.getFullName(),
                        user.getRole() == null ? "USER" : user.getRole()
                );
            }
        }
    }

    public void updateProfile(User user) {
        try {
            String sql = "UPDATE users SET full_name = ?, phone_number = ?, date_of_birth = ?, " +
                         "profile_pic_url = ?, theme = ?, language = ? WHERE id = ?";
            jdbcTemplate.update(sql,
                    user.getFullName(),
                    user.getPhoneNumber(),
                    user.getDateOfBirth() != null ? Date.valueOf(user.getDateOfBirth()) : null,
                    user.getProfilePicUrl(),
                    user.getTheme(),
                    user.getLanguage(),
                    user.getId()
            );
        } catch (Exception e) {
            System.out.println("⚠️ Profile columns missing. Run the migration to add phone_number, date_of_birth, profile_pic_url, theme, language to users.");
            throw e;
        }
    }

    public void updatePassword(Long userId, String newHashedPassword) {
        String sql = "UPDATE users SET password = ? WHERE id = ?";
        jdbcTemplate.update(sql, newHashedPassword, userId);
    }

    public void deactivate(Long userId) {
        try {
            String sql = "UPDATE users SET active = ? WHERE id = ?";
            jdbcTemplate.update(sql, false, userId);
        } catch (Exception e) {
            System.out.println("⚠️ 'active' column missing. Run the migration to add it to users.");
            throw e;
        }
    }

    public void updateTwoFactor(Long userId, boolean enabled) {
        try {
            String sql = "UPDATE users SET two_factor_enabled = ? WHERE id = ?";
            jdbcTemplate.update(sql, enabled, userId);
        } catch (Exception e) {
            System.out.println("⚠️ 'two_factor_enabled' column missing. Run the migration to add it to users.");
            throw e;
        }
    }

    public void updateTwoFactorCode(Long userId, String code, java.time.LocalDateTime expiry) {
        try {
            String sql = "UPDATE users SET two_factor_code = ?, two_factor_code_expiry = ? WHERE id = ?";
            jdbcTemplate.update(sql, code, expiry != null ? Timestamp.valueOf(expiry) : null, userId);
        } catch (Exception e) {
            System.out.println("⚠️ 'two_factor_code' columns missing. Run the migration to add them to users.");
            throw e;
        }
    }

    public void clearTwoFactorCode(Long userId) {
        try {
            String sql = "UPDATE users SET two_factor_code = NULL, two_factor_code_expiry = NULL WHERE id = ?";
            jdbcTemplate.update(sql, userId);
        } catch (Exception e) {
            System.out.println("⚠️ 'two_factor_code' columns missing.");
        }
    }

    public void updateResetCode(Long userId, String code, java.time.LocalDateTime expiry) {
        String sql = "UPDATE users SET reset_code = ?, reset_code_expiry = ? WHERE id = ?";
        jdbcTemplate.update(sql, code, expiry != null ? Timestamp.valueOf(expiry) : null, userId);
    }

    public void clearResetCode(Long userId) {
        String sql = "UPDATE users SET reset_code = NULL, reset_code_expiry = NULL WHERE id = ?";
        jdbcTemplate.update(sql, userId);
    }
}