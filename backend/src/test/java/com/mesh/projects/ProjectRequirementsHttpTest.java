package com.mesh.projects;

import com.mesh.common.ApiException;
import com.mesh.common.ApiExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.List;
import java.util.UUID;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ProjectRequirementsHttpTest {
    private final ProjectRequirementsService service = mock(ProjectRequirementsService.class);
    private final ProjectRequirementsController controller = new ProjectRequirementsController(service);
    private final UUID userId = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();

    @Test void authenticated_member_reads_requirements_and_owner_replaces_them() throws Exception {
        var response = new ProjectRequirementsService.Response(projectId, "DRAFT", (short) 4, List.of());
        when(service.get(userId, projectId)).thenReturn(response);
        when(service.replace(eq(userId), eq(projectId), any())).thenReturn(response);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(userId, "n/a"));
        try {
            var mvc = MockMvcBuilders.standaloneSetup(controller).setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).setControllerAdvice(new ApiExceptionHandler()).build();
            mvc.perform(get("/projects/{projectId}/requirements", projectId)).andExpect(status().isOk()).andExpect(jsonPath("$.targetTeamSize").value(4));
            mvc.perform(put("/projects/{projectId}/requirements", projectId).contentType("application/json")
                .content("{\"targetTeamSize\":4,\"lifecycle\":\"DRAFT\",\"requirements\":[]}"))
                .andExpect(status().isOk());
            mvc.perform(put("/projects/{projectId}/requirements", projectId).contentType("application/json")
                .content("{\"targetTeamSize\":0,\"lifecycle\":\"DRAFT\",\"requirements\":[]}"))
                .andExpect(status().isBadRequest());
        } finally { SecurityContextHolder.clearContext(); }
    }

    @Test void forbidden_owner_write_is_reported_as_403() throws Exception {
        when(service.replace(eq(userId), eq(projectId), any())).thenThrow(new ApiException(HttpStatus.FORBIDDEN, "Only the project owner can perform this action."));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(userId, "n/a"));
        try {
            var mvc = MockMvcBuilders.standaloneSetup(controller).setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).setControllerAdvice(new ApiExceptionHandler()).build();
            mvc.perform(put("/projects/{projectId}/requirements", projectId).contentType("application/json")
                .content("{\"targetTeamSize\":4,\"lifecycle\":\"DRAFT\",\"requirements\":[]}"))
                .andExpect(status().isForbidden());
        } finally { SecurityContextHolder.clearContext(); }
    }
}
