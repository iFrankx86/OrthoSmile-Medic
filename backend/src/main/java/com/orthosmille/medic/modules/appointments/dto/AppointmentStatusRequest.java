package com.orthosmille.medic.modules.appointments.dto;

import com.orthosmille.medic.modules.appointments.entity.AppointmentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AppointmentStatusRequest(
        @NotNull(message = "status is required") AppointmentStatus status,
        @Size(max = 255) String canceledReason
) {
}
