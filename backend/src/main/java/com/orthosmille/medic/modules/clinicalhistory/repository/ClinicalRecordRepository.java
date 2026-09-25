package com.orthosmille.medic.modules.clinicalhistory.repository;

import com.orthosmille.medic.modules.clinicalhistory.entity.ClinicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClinicalRecordRepository extends JpaRepository<ClinicalRecord, Long> {
    Optional<ClinicalRecord> findByAppointmentId(Long appointmentId);

    List<ClinicalRecord> findByPatientIdOrderByAttentionDateDesc(Long patientId);
}
