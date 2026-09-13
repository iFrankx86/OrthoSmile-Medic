package com.orthosmille.medic.modules.clinicalhistory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record ClinicalRecordRequest(
        @NotNull(message = "appointmentId is required") Long appointmentId,
        @NotNull(message = "patientId is required") Long patientId,
        @NotNull(message = "professionalId is required") Long professionalId,
        @NotNull(message = "attentionDate is required") LocalDateTime attentionDate,
        @NotBlank(message = "chiefComplaint is required") String chiefComplaint,
        String diagnosis,
        String treatmentPlan,
        @NotBlank(message = "clinicalNotes is required") String clinicalNotes
) {
}
