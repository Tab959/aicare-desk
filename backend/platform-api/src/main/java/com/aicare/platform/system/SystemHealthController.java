package com.aicare.platform.system;

import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system")
public class SystemHealthController {

    private final String version;

    public SystemHealthController(@Value("${aicare.version:0.1.0-SNAPSHOT}") String version) {
        this.version = version;
    }

    @GetMapping("/health")
    public ResponseEntity<SystemHealthResponse> health() {
        return ResponseEntity.ok(new SystemHealthResponse(
                "UP",
                "aicare-platform-api",
                version,
                Instant.now()
        ));
    }
}
