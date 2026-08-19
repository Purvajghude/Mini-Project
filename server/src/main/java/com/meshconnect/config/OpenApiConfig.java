package com.meshconnect.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Publishes the REST contract at /swagger-ui.html. Declaring the bearer scheme here
 * means the "Authorize" button in Swagger UI works, so the whole API can be exercised
 * from the browser without a separate HTTP client.
 */
@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    OpenAPI meshConnectOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Mesh Connect API")
                        .version("1.0.0")
                        .description("""
                                REST API for Mesh Connect, a campus collaboration platform that matches students \
                                by complementary skills rather than by popularity.

                                Call POST /api/v1/auth/login to obtain a token, then press Authorize and paste it. \
                                Every other endpoint requires that bearer token.""")
                        .contact(new Contact().name("Mesh Connect"))
                        .license(new License().name("MIT")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))
                .components(new Components().addSecuritySchemes(BEARER_SCHEME, new SecurityScheme()
                        .name(BEARER_SCHEME)
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("Paste the token returned by /api/v1/auth/login")));
    }
}
