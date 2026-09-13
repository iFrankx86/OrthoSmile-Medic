package com.orthosmille.medic.modules.patients.dto;

import com.orthosmille.medic.modules.patients.entity.DocumentType;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record PatientRequest(
        @NotBlank(message = "firstName is required") @Size(max = 80) String firstName,
        @NotBlank(message = "lastName is required") @Size(max = 80) String lastName,
        @NotNull(message = "documentType is required") DocumentType documentType,
        @NotBlank(message = "documentNumber is required") @Size(max = 30) String documentNumber,
        @NotNull(message = "birthDate is required") @Past LocalDate birthDate,
        @Email(message = "invalid email") @Size(max = 120) String email,
        @Size(max = 30) String phone,
        @Size(max = 255) String address
) {
}
