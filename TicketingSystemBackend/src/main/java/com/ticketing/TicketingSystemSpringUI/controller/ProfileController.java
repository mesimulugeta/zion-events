package com.ticketing.TicketingSystemSpringUI.controller;

import com.ticketing.TicketingSystemSpringUI.dto.ChangePasswordRequest;
import com.ticketing.TicketingSystemSpringUI.dto.UpdateProfileRequest;
import com.ticketing.TicketingSystemSpringUI.dto.UserProfileDTO;
import com.ticketing.TicketingSystemSpringUI.service.ProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<UserProfileDTO> getProfile(Authentication authentication) {
        return ResponseEntity.ok(profileService.getProfile(authentication.getName()));
    }

    @PutMapping
    public ResponseEntity<UserProfileDTO> updateProfile(
            Authentication authentication,
            @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(profileService.updateProfile(authentication.getName(), request));
    }

    @PostMapping(value = "/picture", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadProfilePicture(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {
        try {
            UserProfileDTO updated = profileService.updateProfilePicture(authentication.getName(), file);
            return ResponseEntity.ok(updated);
        } catch (java.io.IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Image upload failed"));
        }
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(
            Authentication authentication,
            @RequestBody ChangePasswordRequest request) {
        profileService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> deleteAccount(Authentication authentication) {
        profileService.deactivateAccount(authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Account deactivated"));
    }
}