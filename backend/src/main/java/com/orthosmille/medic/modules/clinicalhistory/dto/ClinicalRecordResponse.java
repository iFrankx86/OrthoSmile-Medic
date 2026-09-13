package com.orthosmille.medic.modules.clinicalhistory.dto;

import java.time.LocalDateTime;

public record ClinicalRecordResponse(
        Long id,
        Long appointmentId,
        Long patientId,
        Long professionalId,
        LocalDateTime attentionDate,
        String chiefComplaint,
        String diagnosis,
        String treatmentPlan,
        String clinicalNotes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
