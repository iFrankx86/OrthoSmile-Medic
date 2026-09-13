package com.orthosmille.medic.modules.audit.service;

import com.orthosmille.medic.modules.audit.dto.AuditLogResponse;
import com.orthosmille.medic.modules.audit.entity.AuditLog;
import com.orthosmille.medic.modules.audit.repository.AuditLogRepository;
import com.orthosmille.medic.modules.auth.entity.User;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(User user, String action, String entityName, String entityId, String metadata) {
        AuditLog log = new AuditLog();
        log.setUser(user);
        log.setAction(action);
        log.setEntityName(entityName);
        log.setEntityId(entityId);
        log.setMetadata(metadata);
        auditLogRepository.save(log);
    }

    public List<AuditLogResponse> listRecent() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    private AuditLogResponse toResponse(AuditLog auditLog) {
        return new AuditLogResponse(
                auditLog.getId(),
                auditLog.getUser() != null ? auditLog.getUser().getId() : null,
                auditLog.getAction(),
                auditLog.getEntityName(),
                auditLog.getEntityId(),
                auditLog.getMetadata(),
                auditLog.getCreatedAt()
        );
    }
}
