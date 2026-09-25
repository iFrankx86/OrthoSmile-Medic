package com.orthosmille.medic.modules.appointments.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record AppointmentRequest(
        @NotNull(message = "patientId is required") Long patientId,
        @NotNull(message = "professionalId is required") Long professionalId,
        @NotNull(message = "scheduledStart is required") @Future(message = "scheduledStart must be in the future") LocalDateTime scheduledStart,
        @NotNull(message = "scheduledEnd is required") @Future(message = "scheduledEnd must be in the future") LocalDateTime scheduledEnd,
        @Size(max = 255) String reason,
        String notes
) {
}
