package com.orthosmille.medic.modules.clinicalhistory.service;

import com.orthosmille.medic.common.exception.ConflictException;
import com.orthosmille.medic.common.exception.ResourceNotFoundException;
import com.orthosmille.medic.modules.appointments.entity.Appointment;
import com.orthosmille.medic.modules.appointments.entity.AppointmentStatus;
import com.orthosmille.medic.modules.appointments.repository.AppointmentRepository;
import com.orthosmille.medic.modules.audit.service.AuditService;
import com.orthosmille.medic.modules.clinicalhistory.dto.ClinicalRecordRequest;
import com.orthosmille.medic.modules.clinicalhistory.dto.ClinicalRecordResponse;
import com.orthosmille.medic.modules.clinicalhistory.entity.ClinicalRecord;
import com.orthosmille.medic.modules.clinicalhistory.repository.ClinicalRecordRepository;
import com.orthosmille.medic.modules.patients.entity.Patient;
import com.orthosmille.medic.modules.patients.repository.PatientRepository;
import com.orthosmille.medic.modules.professionals.entity.Professional;
import com.orthosmille.medic.modules.professionals.repository.ProfessionalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ClinicalRecordService {

    private final ClinicalRecordRepository clinicalRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final ProfessionalRepository professionalRepository;
    private final AuditService auditService;

    public ClinicalRecordService(
            ClinicalRecordRepository clinicalRecordRepository,
            AppointmentRepository appointmentRepository,
            PatientRepository patientRepository,
            ProfessionalRepository professionalRepository,
            AuditService auditService
    ) {
        this.clinicalRecordRepository = clinicalRecordRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.professionalRepository = professionalRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<ClinicalRecordResponse> findByPatient(Long patientId) {
        return clinicalRecordRepository.findByPatientIdOrderByAttentionDateDesc(patientId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClinicalRecordResponse findById(Long id) {
        ClinicalRecord clinicalRecord = clinicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Clinical record not found with id=" + id));
        return toResponse(clinicalRecord);
    }

    @Transactional
    public ClinicalRecordResponse create(ClinicalRecordRequest request) {
        if (clinicalRecordRepository.findByAppointmentId(request.appointmentId()).isPresent()) {
            throw new ConflictException("Clinical record already exists for appointment");
        }

        Appointment appointment = appointmentRepository.findById(request.appointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id=" + request.appointmentId()));
        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id=" + request.patientId()));
        Professional professional = professionalRepository.findById(request.professionalId())
                .orElseThrow(() -> new ResourceNotFoundException("Professional not found with id=" + request.professionalId()));

        ClinicalRecord clinicalRecord = new ClinicalRecord();
        clinicalRecord.setAppointment(appointment);
        clinicalRecord.setPatient(patient);
        clinicalRecord.setProfessional(professional);
        clinicalRecord.setAttentionDate(request.attentionDate());
        clinicalRecord.setChiefComplaint(request.chiefComplaint());
        clinicalRecord.setDiagnosis(request.diagnosis());
        clinicalRecord.setTreatmentPlan(request.treatmentPlan());
        clinicalRecord.setClinicalNotes(request.clinicalNotes());

        appointment.setStatus(AppointmentStatus.ATENDIDA);
        appointmentRepository.save(appointment);

        ClinicalRecord saved = clinicalRecordRepository.save(clinicalRecord);
        auditService.log(null, "CLINICAL_RECORD_CREATED", "ClinicalRecord", String.valueOf(saved.getId()), "{}");
        return toResponse(saved);
    }

    private ClinicalRecordResponse toResponse(ClinicalRecord clinicalRecord) {
        return new ClinicalRecordResponse(
                clinicalRecord.getId(),
                clinicalRecord.getAppointment().getId(),
                clinicalRecord.getPatient().getId(),
                clinicalRecord.getProfessional().getId(),
                clinicalRecord.getAttentionDate(),
                clinicalRecord.getChiefComplaint(),
                clinicalRecord.getDiagnosis(),
                clinicalRecord.getTreatmentPlan(),
                clinicalRecord.getClinicalNotes(),
                clinicalRecord.getCreatedAt(),
                clinicalRecord.getUpdatedAt()
        );
    }
}
