package com.mesh.common;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties("mesh.web")
public record WebProperties(List<String> allowedOrigins) {
    public WebProperties {
        allowedOrigins = allowedOrigins == null ? List.of() : allowedOrigins.stream().filter(origin -> origin != null && !origin.isBlank()).map(String::trim).toList();
    }
}
