package com.ticketing.TicketingSystemSpringUI.controller;

import com.ticketing.TicketingSystemSpringUI.service.ProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/profile")
public class AdminProfileController {

    private final ProfileService profileService;

    public AdminProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @PutMapping("/2fa")
    public ResponseEntity<Map<String, String>> toggleTwoFactor(
            Authentication authentication,
            @RequestParam boolean enabled) {
        profileService.setTwoFactorEnabled(authentication.getName(), enabled);
        return ResponseEntity.ok(Map.of("message", "2FA setting updated"));
    }
}