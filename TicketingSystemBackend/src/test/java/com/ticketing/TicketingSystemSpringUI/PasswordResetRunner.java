package com.ticketing.TicketingSystemSpringUI;

import com.ticketing.TicketingSystemSpringUI.domain.User;
import com.ticketing.TicketingSystemSpringUI.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordResetRunner implements CommandLineRunner {

    private final UserRepository userRepository; // Replace with your actual repository name
    private final PasswordEncoder passwordEncoder;

    // Constructor injection
    public PasswordResetRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        String username = "ruhi12"; // <--- Put your username here
        String newPassword = "ruhi123"; // <--- Put your desired new password here

        // Replace 'User' with your actual entity class name
        // Replace 'findByUsername' with your actual repository method
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        System.out.println("✅ Password successfully reset for user: " + username);
    }
}