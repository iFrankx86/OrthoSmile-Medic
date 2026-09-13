package com.orthosmille.medic.modules.professionals.repository;

import com.orthosmille.medic.modules.professionals.entity.Professional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProfessionalRepository extends JpaRepository<Professional, Long> {
    boolean existsByLicenseNumber(String licenseNumber);

    List<Professional> findByActiveTrueOrderByIdDesc();
}
