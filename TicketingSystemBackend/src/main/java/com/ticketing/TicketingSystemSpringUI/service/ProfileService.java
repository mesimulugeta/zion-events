package com.ticketing.TicketingSystemSpringUI.service;

import com.ticketing.TicketingSystemSpringUI.domain.User;
import com.ticketing.TicketingSystemSpringUI.dto.ChangePasswordRequest;
import com.ticketing.TicketingSystemSpringUI.dto.UpdateProfileRequest;
import com.ticketing.TicketingSystemSpringUI.dto.UserProfileDTO;
import com.ticketing.TicketingSystemSpringUI.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.NoSuchElementException;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ImageUploadService imageUploadService;

    public ProfileService(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          ImageUploadService imageUploadService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.imageUploadService = imageUploadService;
    }

    public UserProfileDTO getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        return toDTO(user);
    }

    public UserProfileDTO updateProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());
        if (request.getProfilePicUrl() != null) user.setProfilePicUrl(request.getProfilePicUrl());
        if (request.getTheme() != null) user.setTheme(request.getTheme());
        if (request.getLanguage() != null) user.setLanguage(request.getLanguage());

        userRepository.updateProfile(user);
        return toDTO(user);
    }

    public UserProfileDTO updateProfilePicture(String username, MultipartFile file) throws IOException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        String url = imageUploadService.uploadImage(file);
        user.setProfilePicUrl(url);
        userRepository.updateProfile(user);
        return toDTO(user);
    }

    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        String hashed = passwordEncoder.encode(request.getNewPassword());
        userRepository.updatePassword(user.getId(), hashed);
    }

    public void deactivateAccount(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        userRepository.deactivate(user.getId());
    }

    public void setTwoFactorEnabled(String username, boolean enabled) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new IllegalStateException("2FA is only available for admin accounts");
        }

        userRepository.updateTwoFactor(user.getId(), enabled);
    }

    private UserProfileDTO toDTO(User user) {
        UserProfileDTO dto = new UserProfileDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setProfilePicUrl(user.getProfilePicUrl());
        dto.setTheme(user.getTheme());
        dto.setLanguage(user.getLanguage());
        dto.setRole(user.getRole());
        dto.setTwoFactorEnabled(user.isTwoFactorEnabled());
        return dto;
    }
}