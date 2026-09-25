package com.orthosmille.medic.modules.clinicalhistory.controller;

import com.orthosmille.medic.modules.clinicalhistory.dto.ClinicalRecordRequest;
import com.orthosmille.medic.modules.clinicalhistory.dto.ClinicalRecordResponse;
import com.orthosmille.medic.modules.clinicalhistory.service.ClinicalRecordService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clinical-history")
public class ClinicalRecordController {

    private final ClinicalRecordService clinicalRecordService;

    public ClinicalRecordController(ClinicalRecordService clinicalRecordService) {
        this.clinicalRecordService = clinicalRecordService;
    }

    @GetMapping("/patients/{patientId}")
    public ResponseEntity<List<ClinicalRecordResponse>> listByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(clinicalRecordService.findByPatient(patientId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClinicalRecordResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(clinicalRecordService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ClinicalRecordResponse> create(@Valid @RequestBody ClinicalRecordRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clinicalRecordService.create(request));
    }
}
