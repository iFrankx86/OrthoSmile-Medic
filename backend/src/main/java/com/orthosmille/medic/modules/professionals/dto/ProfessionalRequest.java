package com.orthosmille.medic.modules.professionals.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfessionalRequest(
        @NotBlank(message = "firstName is required") @Size(max = 80) String firstName,
        @NotBlank(message = "lastName is required") @Size(max = 80) String lastName,
        @NotBlank(message = "licenseNumber is required") @Size(max = 50) String licenseNumber,
        @NotBlank(message = "specialty is required") @Size(max = 100) String specialty,
        @Size(max = 30) String phone
) {
}
