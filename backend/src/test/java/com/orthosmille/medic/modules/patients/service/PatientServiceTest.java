package com.orthosmille.medic.modules.patients.service;

import com.orthosmille.medic.common.exception.ConflictException;
import com.orthosmille.medic.modules.audit.service.AuditService;
import com.orthosmille.medic.modules.patients.dto.PatientRequest;
import com.orthosmille.medic.modules.patients.entity.DocumentType;
import com.orthosmille.medic.modules.patients.entity.Patient;
import com.orthosmille.medic.modules.patients.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private PatientService patientService;

    private PatientRequest request;

    @BeforeEach
    void setUp() {
        request = new PatientRequest(
                "Ana",
                "Perez",
                DocumentType.DNI,
                "12345678",
                LocalDate.of(1999, 10, 10),
                "ana@test.com",
                "999999999",
                "Lima"
        );
    }

    @Test
    void create_shouldReturnPatientResponse_whenRequestIsValid() {
        when(patientRepository.existsByDocumentTypeAndDocumentNumber(DocumentType.DNI, "12345678")).thenReturn(false);
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = patientService.create(request);

        assertNotNull(response);
        assertEquals("Ana", response.firstName());
        verify(patientRepository, times(1)).save(any(Patient.class));
        verify(auditService, times(1)).log(isNull(), eq("PATIENT_CREATED"), eq("Patient"), eq("null"), eq("{}"));
    }

    @Test
    void create_shouldThrowConflictException_whenDocumentAlreadyExists() {
        when(patientRepository.existsByDocumentTypeAndDocumentNumber(DocumentType.DNI, "12345678")).thenReturn(true);

        assertThrows(ConflictException.class, () -> patientService.create(request));
        verify(patientRepository, never()).save(any(Patient.class));
    }
}
