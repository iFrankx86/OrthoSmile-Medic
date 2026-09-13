package com.orthosmille.medic.modules.audit.dto;

import java.time.LocalDateTime;

public record AuditLogResponse(
        Long id,
        Long userId,
        String action,
        String entityName,
        String entityId,
        String metadata,
        LocalDateTime createdAt
) {
}
