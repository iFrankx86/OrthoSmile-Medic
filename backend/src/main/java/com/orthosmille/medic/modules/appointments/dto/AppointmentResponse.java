package com.orthosmille.medic.modules.appointments.dto;

import com.orthosmille.medic.modules.appointments.entity.AppointmentStatus;

import java.time.LocalDateTime;

public record AppointmentResponse(
        Long id,
        Long patientId,
        Long professionalId,
        LocalDateTime scheduledStart,
        LocalDateTime scheduledEnd,
        AppointmentStatus status,
        String reason,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
