package com.ticketing.TicketingSystemSpringUI.domain;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String username;
    private String email;
    private String password;
    private String fullName;
    private String role;
    private LocalDateTime createdAt = LocalDateTime.now();
    private boolean verified = false;
    private String verificationCode;
    private LocalDateTime verificationCodeExpiry;

    private String phoneNumber;
    private LocalDate dateOfBirth;
    private String profilePicUrl;

    
    private String theme = "LIGHT";
    private String language = "ENGLISH";

    private boolean active = true;

    private boolean twoFactorEnabled = false;
    private String twoFactorSecret; 
    private String twoFactorCode;
    private LocalDateTime twoFactorCodeExpiry;

    private String resetCode;
    private LocalDateTime resetCodeExpiry;

    public User() {}
    public User(String username, String email, String password, String fullName) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.role = "USER";
        this.createdAt = LocalDateTime.now();
    }
    public Long getId() { 
        return id; 
    }
    public void setId(Long id) { 
        this.id = id; 
    }
    public String getUsername() {
        return username; 
    }
    public void setUsername(String username) { 
        this.username = username; 
    }
    public String getEmail() {
        return email; 
    }
    public void setEmail(String email) {
        this.email = email; 
    }
    public String getPassword() {
        return password; 
    }
    public void setPassword(String password) {
        this.password = password; 
    }
    public String getFullName() {
        return fullName; 
    }
    public void setFullName(String fullName) {
        this.fullName = fullName; 
    }
    public String getRole() {
        return role; 
    }
    public void setRole(String role) {
        this.role = role; 
    }
    public LocalDateTime getCreatedAt() {
        return createdAt; 
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt; 
    }
    public boolean isVerified() {
        return verified; 
    }
    public void setVerified(boolean verified) {
        this.verified = verified; 
    }
    public String getVerificationCode() {
        return verificationCode; 
    }
    public void setVerificationCode(String verificationCode) {
        this.verificationCode = verificationCode; 
    }
    public LocalDateTime getVerificationCodeExpiry() {
        return verificationCodeExpiry; 
    }
    public void setVerificationCodeExpiry(LocalDateTime verificationCodeExpiry) {
        this.verificationCodeExpiry = verificationCodeExpiry; 
    }
    public String getPhoneNumber() {
        return phoneNumber; 
    }
    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber; 
    }
    public LocalDate getDateOfBirth() {
        return dateOfBirth; 
    }
    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth; 
    }
    public String getProfilePicUrl() {
        return profilePicUrl; 
    }
    public void setProfilePicUrl(String profilePicUrl) {
        this.profilePicUrl = profilePicUrl; 
    }
    public String getTheme() {
        return theme; 
    }
    public void setTheme(String theme) {
        this.theme = theme; 
    }
    public String getLanguage() {
        return language; 
    }
    public void setLanguage(String language) {
        this.language = language; 
    }
    public boolean isActive() {
        return active; 
    }
    public void setActive(boolean active) {
        this.active = active; 
    }
    public boolean isTwoFactorEnabled() {
        return twoFactorEnabled; 
    }
    public void setTwoFactorEnabled(boolean twoFactorEnabled) {
        this.twoFactorEnabled = twoFactorEnabled; 
    }
    public String getTwoFactorSecret() {
        return twoFactorSecret; 
    }
    public void setTwoFactorSecret(String twoFactorSecret) {
        this.twoFactorSecret = twoFactorSecret; 
    }
    public String getTwoFactorCode() {
        return twoFactorCode; 
    }
    public void setTwoFactorCode(String twoFactorCode) {
        this.twoFactorCode = twoFactorCode; 
    }
    public LocalDateTime getTwoFactorCodeExpiry() {
        return twoFactorCodeExpiry; 
    }
    public void setTwoFactorCodeExpiry(LocalDateTime twoFactorCodeExpiry) {
        this.twoFactorCodeExpiry = twoFactorCodeExpiry; 
    }
    public String getResetCode() {
        return resetCode; 
    }
    public void setResetCode(String resetCode) {
        this.resetCode = resetCode; 
    }
    public LocalDateTime getResetCodeExpiry() {
        return resetCodeExpiry; 
    }
    public void setResetCodeExpiry(LocalDateTime resetCodeExpiry) {
        this.resetCodeExpiry = resetCodeExpiry; 
    }
}