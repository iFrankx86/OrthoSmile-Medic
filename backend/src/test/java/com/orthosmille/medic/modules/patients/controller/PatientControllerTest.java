package com.orthosmille.medic.modules.patients.controller;

import com.orthosmille.medic.config.SecurityConfig;
import com.orthosmille.medic.modules.patients.dto.PatientResponse;
import com.orthosmille.medic.modules.patients.entity.DocumentType;
import com.orthosmille.medic.modules.patients.service.PatientService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PatientController.class)
@Import(SecurityConfig.class)
class PatientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PatientService patientService;

    @Test
    void list_shouldReturnOk() throws Exception {
        when(patientService.findAll(any())).thenReturn(List.of(new PatientResponse(
                1L,
                "Ana",
                "Perez",
                DocumentType.DNI,
                "12345678",
                LocalDate.of(1999, 10, 10),
                "ana@test.com",
                "999999999",
                "Lima",
                true,
                LocalDateTime.now(),
                LocalDateTime.now()
        )));

        mockMvc.perform(get("/api/v1/patients").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].firstName").value("Ana"));
    }
}
