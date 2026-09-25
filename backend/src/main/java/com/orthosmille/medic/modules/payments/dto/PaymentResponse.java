package com.orthosmille.medic.modules.payments.dto;

import com.orthosmille.medic.modules.payments.entity.PaymentMethod;
import com.orthosmille.medic.modules.payments.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        Long clinicalRecordId,
        BigDecimal amount,
        String currency,
        PaymentMethod paymentMethod,
        PaymentStatus status,
        String reference,
        String notes,
        LocalDateTime paidAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
