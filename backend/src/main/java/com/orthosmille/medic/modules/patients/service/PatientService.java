package com.orthosmille.medic.modules.patients.service;

import com.orthosmille.medic.common.exception.ConflictException;
import com.orthosmille.medic.common.exception.ResourceNotFoundException;
import com.orthosmille.medic.modules.audit.service.AuditService;
import com.orthosmille.medic.modules.patients.dto.PatientRequest;
import com.orthosmille.medic.modules.patients.dto.PatientResponse;
import com.orthosmille.medic.modules.patients.entity.Patient;
import com.orthosmille.medic.modules.patients.repository.PatientRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PatientService {

    private static final Logger logger = LoggerFactory.getLogger(PatientService.class);

    private final PatientRepository patientRepository;
    private final AuditService auditService;

    public PatientService(PatientRepository patientRepository, AuditService auditService) {
        this.patientRepository = patientRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> findAll(String query) {
        List<Patient> patients = (query == null || query.isBlank())
                ? patientRepository.findByActiveTrueOrderByIdDesc()
                : patientRepository.searchActive(query.trim());
        return patients.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PatientResponse findById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id=" + id));
        return toResponse(patient);
    }

    @Transactional
    public PatientResponse create(PatientRequest request) {
        if (patientRepository.existsByDocumentTypeAndDocumentNumber(request.documentType(), request.documentNumber())) {
            throw new ConflictException("Patient document already exists");
        }

        Patient patient = new Patient();
        apply(patient, request);
        patient.setActive(true);

        Patient saved = patientRepository.save(patient);
        auditService.log(null, "PATIENT_CREATED", "Patient", String.valueOf(saved.getId()), "{}");
        logger.info("Patient created id={}", saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public PatientResponse update(Long id, PatientRequest request) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id=" + id));

        boolean sameDocument = patient.getDocumentType() == request.documentType()
                && patient.getDocumentNumber().equalsIgnoreCase(request.documentNumber());

        if (!sameDocument && patientRepository.existsByDocumentTypeAndDocumentNumber(request.documentType(), request.documentNumber())) {
            throw new ConflictException("Patient document already exists");
        }

        apply(patient, request);
        Patient saved = patientRepository.save(patient);
        auditService.log(null, "PATIENT_UPDATED", "Patient", String.valueOf(saved.getId()), "{}");
        logger.info("Patient updated id={}", saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public PatientResponse changeStatus(Long id, boolean active) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id=" + id));

        patient.setActive(active);
        patient.setDeletedAt(active ? null : LocalDateTime.now());
        Patient saved = patientRepository.save(patient);
        auditService.log(null, "PATIENT_STATUS_CHANGED", "Patient", String.valueOf(saved.getId()), "{\"active\":" + active + "}");
        logger.info("Patient status changed id={} active={}", saved.getId(), active);
        return toResponse(saved);
    }

    private void apply(Patient patient, PatientRequest request) {
        patient.setFirstName(request.firstName().trim());
        patient.setLastName(request.lastName().trim());
        patient.setDocumentType(request.documentType());
        patient.setDocumentNumber(request.documentNumber().trim());
        patient.setBirthDate(request.birthDate());
        patient.setEmail(request.email());
        patient.setPhone(request.phone());
        patient.setAddress(request.address());
    }

    private PatientResponse toResponse(Patient patient) {
        return new PatientResponse(
                patient.getId(),
                patient.getFirstName(),
                patient.getLastName(),
                patient.getDocumentType(),
                patient.getDocumentNumber(),
                patient.getBirthDate(),
                patient.getEmail(),
                patient.getPhone(),
                patient.getAddress(),
                patient.getActive(),
                patient.getCreatedAt(),
                patient.getUpdatedAt()
        );
    }
}
