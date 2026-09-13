package com.orthosmille.medic.modules.professionals.dto;

import java.time.LocalDateTime;

public record ProfessionalResponse(
        Long id,
        Long userId,
        String firstName,
        String lastName,
        String licenseNumber,
        String specialty,
        String phone,
        Boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
