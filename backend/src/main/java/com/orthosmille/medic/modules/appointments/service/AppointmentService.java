package com.orthosmille.medic.modules.appointments.service;

import com.orthosmille.medic.common.exception.ConflictException;
import com.orthosmille.medic.common.exception.ResourceNotFoundException;
import com.orthosmille.medic.modules.appointments.dto.AppointmentRequest;
import com.orthosmille.medic.modules.appointments.dto.AppointmentResponse;
import com.orthosmille.medic.modules.appointments.dto.AppointmentStatusRequest;
import com.orthosmille.medic.modules.appointments.entity.Appointment;
import com.orthosmille.medic.modules.appointments.entity.AppointmentStatus;
import com.orthosmille.medic.modules.appointments.repository.AppointmentRepository;
import com.orthosmille.medic.modules.audit.service.AuditService;
import com.orthosmille.medic.modules.patients.entity.Patient;
import com.orthosmille.medic.modules.patients.repository.PatientRepository;
import com.orthosmille.medic.modules.professionals.entity.Professional;
import com.orthosmille.medic.modules.professionals.repository.ProfessionalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class AppointmentService {

    private static final Set<AppointmentStatus> BLOCKING_STATUSES = Set.of(
            AppointmentStatus.PROGRAMADA,
            AppointmentStatus.CONFIRMADA
    );

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final ProfessionalRepository professionalRepository;
    private final AuditService auditService;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            PatientRepository patientRepository,
            ProfessionalRepository professionalRepository,
            AuditService auditService
    ) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.professionalRepository = professionalRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> findAll() {
        return appointmentRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public AppointmentResponse findById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id=" + id));
        return toResponse(appointment);
    }

    @Transactional
    public AppointmentResponse create(AppointmentRequest request) {
        validateSchedule(request.scheduledStart(), request.scheduledEnd());

        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id=" + request.patientId()));
        Professional professional = professionalRepository.findById(request.professionalId())
                .orElseThrow(() -> new ResourceNotFoundException("Professional not found with id=" + request.professionalId()));

        boolean conflict = appointmentRepository
                .existsByProfessionalIdAndScheduledStartLessThanAndScheduledEndGreaterThanAndStatusIn(
                        professional.getId(), request.scheduledEnd(), request.scheduledStart(), BLOCKING_STATUSES);

        if (conflict) {
            throw new ConflictException("Appointment conflict for professional schedule");
        }

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setProfessional(professional);
        appointment.setScheduledStart(request.scheduledStart());
        appointment.setScheduledEnd(request.scheduledEnd());
        appointment.setReason(request.reason());
        appointment.setNotes(request.notes());
        appointment.setStatus(AppointmentStatus.PROGRAMADA);

        Appointment saved = appointmentRepository.save(appointment);
        auditService.log(null, "APPOINTMENT_CREATED", "Appointment", String.valueOf(saved.getId()), "{}");
        return toResponse(saved);
    }

    @Transactional
    public AppointmentResponse update(Long id, AppointmentRequest request) {
        validateSchedule(request.scheduledStart(), request.scheduledEnd());

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id=" + id));

        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id=" + request.patientId()));
        Professional professional = professionalRepository.findById(request.professionalId())
                .orElseThrow(() -> new ResourceNotFoundException("Professional not found with id=" + request.professionalId()));

        boolean conflict = appointmentRepository
                .existsByProfessionalIdAndIdNotAndScheduledStartLessThanAndScheduledEndGreaterThanAndStatusIn(
                        professional.getId(), id, request.scheduledEnd(), request.scheduledStart(), BLOCKING_STATUSES);

        if (conflict) {
            throw new ConflictException("Appointment conflict for professional schedule");
        }

        appointment.setPatient(patient);
        appointment.setProfessional(professional);
        appointment.setScheduledStart(request.scheduledStart());
        appointment.setScheduledEnd(request.scheduledEnd());
        appointment.setReason(request.reason());
        appointment.setNotes(request.notes());

        Appointment saved = appointmentRepository.save(appointment);
        auditService.log(null, "APPOINTMENT_UPDATED", "Appointment", String.valueOf(saved.getId()), "{}");
        return toResponse(saved);
    }

    @Transactional
    public AppointmentResponse changeStatus(Long id, AppointmentStatusRequest request) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id=" + id));

        appointment.setStatus(request.status());
        if (request.status() == AppointmentStatus.CANCELADA) {
            appointment.setCanceledAt(LocalDateTime.now());
            appointment.setCanceledReason(request.canceledReason());
        }

        Appointment saved = appointmentRepository.save(appointment);
        auditService.log(null, "APPOINTMENT_STATUS_CHANGED", "Appointment", String.valueOf(saved.getId()), "{\"status\":\"" + request.status() + "\"}");
        return toResponse(saved);
    }

    private void validateSchedule(LocalDateTime start, LocalDateTime end) {
        if (!end.isAfter(start)) {
            throw new ConflictException("scheduledEnd must be after scheduledStart");
        }
    }

    private AppointmentResponse toResponse(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getPatient().getId(),
                appointment.getProfessional().getId(),
                appointment.getScheduledStart(),
                appointment.getScheduledEnd(),
                appointment.getStatus(),
                appointment.getReason(),
                appointment.getNotes(),
                appointment.getCreatedAt(),
                appointment.getUpdatedAt()
        );
    }
}
