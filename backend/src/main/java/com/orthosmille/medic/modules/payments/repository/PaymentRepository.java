package com.orthosmille.medic.modules.payments.repository;

import com.orthosmille.medic.modules.payments.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByClinicalRecordPatientIdOrderByPaidAtDesc(Long patientId);
}
