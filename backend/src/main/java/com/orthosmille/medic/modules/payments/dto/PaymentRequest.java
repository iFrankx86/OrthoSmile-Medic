package com.orthosmille.medic.modules.payments.dto;

import com.orthosmille.medic.modules.payments.entity.PaymentMethod;
import com.orthosmille.medic.modules.payments.entity.PaymentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentRequest(
        @NotNull(message = "clinicalRecordId is required") Long clinicalRecordId,
        @NotNull(message = "amount is required") @DecimalMin(value = "0.00", message = "amount must be >= 0") BigDecimal amount,
        @NotNull(message = "paymentMethod is required") PaymentMethod paymentMethod,
        @NotNull(message = "status is required") PaymentStatus status,
        @Size(min = 3, max = 3, message = "currency must have 3 chars") String currency,
        @Size(max = 100) String reference,
        @Size(max = 255) String notes,
        @NotNull(message = "paidAt is required") LocalDateTime paidAt
) {
}
