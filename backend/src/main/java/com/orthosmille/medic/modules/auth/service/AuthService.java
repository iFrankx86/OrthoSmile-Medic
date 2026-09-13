package com.orthosmille.medic.modules.auth.service;

import com.orthosmille.medic.common.exception.ResourceNotFoundException;
import com.orthosmille.medic.modules.auth.dto.LoginRequest;
import com.orthosmille.medic.modules.auth.dto.LoginResponse;
import com.orthosmille.medic.modules.auth.entity.User;
import com.orthosmille.medic.modules.auth.repository.UserRepository;
import com.orthosmille.medic.modules.audit.service.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsernameAndActiveTrue(request.username())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResourceNotFoundException("Invalid credentials");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        auditService.log(user, "LOGIN", "User", String.valueOf(user.getId()), "{}");
        logger.info("User {} logged in", user.getUsername());

        return new LoginResponse(
                user.getId(),
                user.getUsername(),
                user.getRole().name(),
                "PENDING_TOKEN_STRATEGY"
        );
    }
}
