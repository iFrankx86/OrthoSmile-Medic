package com.orthosmille.medic.modules.professionals.service;

import com.orthosmille.medic.common.exception.ConflictException;
import com.orthosmille.medic.common.exception.ResourceNotFoundException;
import com.orthosmille.medic.modules.audit.service.AuditService;
import com.orthosmille.medic.modules.professionals.dto.ProfessionalRequest;
import com.orthosmille.medic.modules.professionals.dto.ProfessionalResponse;
import com.orthosmille.medic.modules.professionals.entity.Professional;
import com.orthosmille.medic.modules.professionals.repository.ProfessionalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ProfessionalService {

    private final ProfessionalRepository professionalRepository;
    private final AuditService auditService;

    public ProfessionalService(ProfessionalRepository professionalRepository, AuditService auditService) {
        this.professionalRepository = professionalRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<ProfessionalResponse> findAll() {
        return professionalRepository.findByActiveTrueOrderByIdDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProfessionalResponse findById(Long id) {
        Professional professional = professionalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Professional not found with id=" + id));
        return toResponse(professional);
    }

    @Transactional
    public ProfessionalResponse create(ProfessionalRequest request) {
        if (professionalRepository.existsByLicenseNumber(request.licenseNumber())) {
            throw new ConflictException("Professional license already exists");
        }

        Professional professional = new Professional();
        apply(professional, request);
        professional.setActive(true);
        Professional saved = professionalRepository.save(professional);
        auditService.log(null, "PROFESSIONAL_CREATED", "Professional", String.valueOf(saved.getId()), "{}");
        return toResponse(saved);
    }

    @Transactional
    public ProfessionalResponse update(Long id, ProfessionalRequest request) {
        Professional professional = professionalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Professional not found with id=" + id));

        if (!professional.getLicenseNumber().equalsIgnoreCase(request.licenseNumber())
                && professionalRepository.existsByLicenseNumber(request.licenseNumber())) {
            throw new ConflictException("Professional license already exists");
        }

        apply(professional, request);
        Professional saved = professionalRepository.save(professional);
        auditService.log(null, "PROFESSIONAL_UPDATED", "Professional", String.valueOf(saved.getId()), "{}");
        return toResponse(saved);
    }

    @Transactional
    public ProfessionalResponse changeStatus(Long id, boolean active) {
        Professional professional = professionalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Professional not found with id=" + id));

        professional.setActive(active);
        professional.setDeletedAt(active ? null : LocalDateTime.now());
        Professional saved = professionalRepository.save(professional);
        auditService.log(null, "PROFESSIONAL_STATUS_CHANGED", "Professional", String.valueOf(saved.getId()), "{\"active\":" + active + "}");
        return toResponse(saved);
    }

    private void apply(Professional professional, ProfessionalRequest request) {
        professional.setFirstName(request.firstName().trim());
        professional.setLastName(request.lastName().trim());
        professional.setLicenseNumber(request.licenseNumber().trim());
        professional.setSpecialty(request.specialty().trim());
        professional.setPhone(request.phone());
    }

    private ProfessionalResponse toResponse(Professional professional) {
        return new ProfessionalResponse(
                professional.getId(),
                professional.getUser() != null ? professional.getUser().getId() : null,
                professional.getFirstName(),
                professional.getLastName(),
                professional.getLicenseNumber(),
                professional.getSpecialty(),
                professional.getPhone(),
                professional.getActive(),
                professional.getCreatedAt(),
                professional.getUpdatedAt()
        );
    }
}
