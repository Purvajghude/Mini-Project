package com.mesh.auth;

import com.mesh.common.WebProperties;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class CorsConfigurationTest {
    @Test
    void allowsOnlyConfiguredFrontendOrigins() {
        SecurityConfig security = new SecurityConfig();
        var source = security.corsConfigurationSource(new WebProperties(List.of("http://localhost:5173", "https://mesh.example.com")));
        var configuration = source.getCorsConfiguration(new MockHttpServletRequest());

        assertEquals(List.of("http://localhost:5173", "https://mesh.example.com"), configuration.getAllowedOrigins());
        assertFalse(configuration.getAllowCredentials());
    }
}
