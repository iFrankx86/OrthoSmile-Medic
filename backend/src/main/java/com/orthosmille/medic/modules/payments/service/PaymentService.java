package com.orthosmille.medic.modules.payments.service;

import com.orthosmille.medic.common.exception.ResourceNotFoundException;
import com.orthosmille.medic.modules.audit.service.AuditService;
import com.orthosmille.medic.modules.clinicalhistory.entity.ClinicalRecord;
import com.orthosmille.medic.modules.clinicalhistory.repository.ClinicalRecordRepository;
import com.orthosmille.medic.modules.payments.dto.PaymentRequest;
import com.orthosmille.medic.modules.payments.dto.PaymentResponse;
import com.orthosmille.medic.modules.payments.entity.Payment;
import com.orthosmille.medic.modules.payments.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ClinicalRecordRepository clinicalRecordRepository;
    private final AuditService auditService;

    public PaymentService(
            PaymentRepository paymentRepository,
            ClinicalRecordRepository clinicalRecordRepository,
            AuditService auditService
    ) {
        this.paymentRepository = paymentRepository;
        this.clinicalRecordRepository = clinicalRecordRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> findAll(Long patientId) {
        if (patientId != null) {
            return paymentRepository.findByClinicalRecordPatientIdOrderByPaidAtDesc(patientId).stream()
                    .map(this::toResponse)
                    .toList();
        }
        return paymentRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PaymentResponse findById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id=" + id));
        return toResponse(payment);
    }

    @Transactional
    public PaymentResponse create(PaymentRequest request) {
        ClinicalRecord clinicalRecord = clinicalRecordRepository.findById(request.clinicalRecordId())
                .orElseThrow(() -> new ResourceNotFoundException("Clinical record not found with id=" + request.clinicalRecordId()));

        Payment payment = new Payment();
        payment.setClinicalRecord(clinicalRecord);
        payment.setAmount(request.amount());
        payment.setPaymentMethod(request.paymentMethod());
        payment.setStatus(request.status());
        payment.setCurrency(request.currency() == null ? "PEN" : request.currency());
        payment.setReference(request.reference());
        payment.setNotes(request.notes());
        payment.setPaidAt(request.paidAt());

        Payment saved = paymentRepository.save(payment);
        auditService.log(null, "PAYMENT_CREATED", "Payment", String.valueOf(saved.getId()), "{}");
        return toResponse(saved);
    }

    private PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getClinicalRecord().getId(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getPaymentMethod(),
                payment.getStatus(),
                payment.getReference(),
                payment.getNotes(),
                payment.getPaidAt(),
                payment.getCreatedAt(),
                payment.getUpdatedAt()
        );
    }
}
