package com.orthosmille.medic.modules.patients.dto;

import com.orthosmille.medic.modules.patients.entity.DocumentType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record PatientResponse(
        Long id,
        String firstName,
        String lastName,
        DocumentType documentType,
        String documentNumber,
        LocalDate birthDate,
        String email,
        String phone,
        String address,
        Boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
