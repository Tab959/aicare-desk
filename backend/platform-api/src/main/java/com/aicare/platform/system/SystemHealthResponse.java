package com.aicare.platform.system;

import java.time.Instant;

public record SystemHealthResponse(
        String status,
        String service,
        String version,
        Instant checkedAt
) {
}
