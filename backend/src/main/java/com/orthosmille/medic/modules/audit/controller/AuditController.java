package com.orthosmille.medic.modules.audit.controller;

import com.orthosmille.medic.modules.audit.dto.AuditLogResponse;
import com.orthosmille.medic.modules.audit.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit-logs")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> listRecent() {
        return ResponseEntity.ok(auditService.listRecent());
    }
}
