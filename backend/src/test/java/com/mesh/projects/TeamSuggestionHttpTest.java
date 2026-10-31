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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class TeamSuggestionHttpTest {
    @Test void exposes_contract_and_validates_alternative_count() throws Exception {
        TeamSuggestionService service = mock(TeamSuggestionService.class);
        UUID ownerId = UUID.randomUUID(), projectId = UUID.randomUUID();
        var gap = new SkillGapAnalysisService.Analysis(projectId, "DRAFT", (short) 3, 1, 2, List.of(), List.of());
        when(service.suggest(eq(ownerId), eq(projectId), any())).thenReturn(new TeamSuggestionService.SuggestionSet(projectId, (short) 3, 1, 2, gap, List.of(), "No eligible students."));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(ownerId, "n/a"));
        try {
            var mvc = MockMvcBuilders.standaloneSetup(new TeamSuggestionController(service))
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setControllerAdvice(new ApiExceptionHandler()).build();
            mvc.perform(post("/projects/{projectId}/team-suggestions", projectId).contentType("application/json").content("{}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.remainingCapacity").value(2))
                .andExpect(jsonPath("$.alternatives").isArray());
            mvc.perform(post("/projects/{projectId}/team-suggestions", projectId).contentType("application/json").content("{\"alternativeCount\":4}"))
                .andExpect(status().isBadRequest());
            verify(service).suggest(eq(ownerId), eq(projectId), argThat(request -> request.alternativeCount() == 3 && request.availabilityPolicy() == TeamSuggestionService.AvailabilityPolicy.ALLOW_UNKNOWN));
        } finally { SecurityContextHolder.clearContext(); }
    }

    @Test void forbidden_service_error_is_visible_as_403() throws Exception {
        TeamSuggestionService service = mock(TeamSuggestionService.class);
        UUID viewerId = UUID.randomUUID(), projectId = UUID.randomUUID();
        when(service.suggest(eq(viewerId), eq(projectId), any())).thenThrow(new ApiException(HttpStatus.FORBIDDEN, "Only the project owner can perform this action."));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(viewerId, "n/a"));
        try {
            var mvc = MockMvcBuilders.standaloneSetup(new TeamSuggestionController(service))
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setControllerAdvice(new ApiExceptionHandler()).build();
            mvc.perform(post("/projects/{projectId}/team-suggestions", projectId).contentType("application/json").content("{}"))
                .andExpect(status().isForbidden());
        } finally { SecurityContextHolder.clearContext(); }
    }
}
