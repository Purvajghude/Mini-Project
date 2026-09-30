package com.mesh.common;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ApiExceptionHandlerTest {
    private final ApiExceptionHandler handler = new ApiExceptionHandler();

    @Test
    void returnsTheDocumentedErrorShapeForMalformedJson() {
        var response = handler.handleMalformedBody(new HttpMessageNotReadableException("invalid JSON", new IllegalArgumentException("invalid JSON"), null), request());

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Request body is malformed or contains an invalid value.", response.getBody().message());
        assertTrue(response.getBody().fields().isEmpty());
        assertEquals("/api/v1/profile/me", response.getBody().path());
    }

    @Test
    void keepsDomainErrorsSpecific() {
        var response = handler.handleApi(new ApiException(HttpStatus.CONFLICT, "Username is already in use."), request());

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Username is already in use.", response.getBody().message());
    }

    private MockHttpServletRequest request() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/profile/me");
        return request;
    }
}
