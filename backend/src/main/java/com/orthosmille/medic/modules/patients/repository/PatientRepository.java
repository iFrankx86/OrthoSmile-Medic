package com.orthosmille.medic.modules.patients.repository;

import com.orthosmille.medic.modules.patients.entity.DocumentType;
import com.orthosmille.medic.modules.patients.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    boolean existsByDocumentTypeAndDocumentNumber(DocumentType documentType, String documentNumber);

    @Query("""
            SELECT p FROM Patient p
            WHERE p.active = true
              AND (
                    LOWER(p.firstName) LIKE LOWER(CONCAT('%', :q, '%'))
                 OR LOWER(p.lastName) LIKE LOWER(CONCAT('%', :q, '%'))
                 OR LOWER(p.documentNumber) LIKE LOWER(CONCAT('%', :q, '%'))
              )
            ORDER BY p.id DESC
            """)
    List<Patient> searchActive(@Param("q") String query);

    List<Patient> findByActiveTrueOrderByIdDesc();
}
