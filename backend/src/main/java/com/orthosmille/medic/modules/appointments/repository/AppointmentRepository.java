package com.orthosmille.medic.modules.appointments.repository;

import com.orthosmille.medic.modules.appointments.entity.Appointment;
import com.orthosmille.medic.modules.appointments.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    boolean existsByProfessionalIdAndScheduledStartLessThanAndScheduledEndGreaterThanAndStatusIn(
            Long professionalId,
            LocalDateTime scheduledEnd,
            LocalDateTime scheduledStart,
            Collection<AppointmentStatus> statuses
    );

    boolean existsByProfessionalIdAndIdNotAndScheduledStartLessThanAndScheduledEndGreaterThanAndStatusIn(
            Long professionalId,
            Long id,
            LocalDateTime scheduledEnd,
            LocalDateTime scheduledStart,
            Collection<AppointmentStatus> statuses
    );

    List<Appointment> findByPatientIdOrderByScheduledStartDesc(Long patientId);
}