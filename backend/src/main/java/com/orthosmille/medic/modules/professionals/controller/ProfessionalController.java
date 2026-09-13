package com.orthosmille.medic.modules.professionals.controller;

import com.orthosmille.medic.modules.professionals.dto.ProfessionalRequest;
import com.orthosmille.medic.modules.professionals.dto.ProfessionalResponse;
import com.orthosmille.medic.modules.professionals.service.ProfessionalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/professionals")
public class ProfessionalController {

    private final ProfessionalService professionalService;

    public ProfessionalController(ProfessionalService professionalService) {
        this.professionalService = professionalService;
    }

    @GetMapping
    public ResponseEntity<List<ProfessionalResponse>> list() {
        return ResponseEntity.ok(professionalService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProfessionalResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(professionalService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ProfessionalResponse> create(@Valid @RequestBody ProfessionalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(professionalService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProfessionalResponse> update(@PathVariable Long id, @Valid @RequestBody ProfessionalRequest request) {
        return ResponseEntity.ok(professionalService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ProfessionalResponse> changeStatus(@PathVariable Long id, @RequestParam("active") boolean active) {
        return ResponseEntity.ok(professionalService.changeStatus(id, active));
    }
}
