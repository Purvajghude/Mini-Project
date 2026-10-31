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

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SkillGapAnalysisHttpTest {
    @Test void returns_contract_and_missing_requirements_conflict() throws Exception {
        SkillGapAnalysisService service = mock(SkillGapAnalysisService.class);
        UUID userId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();
        var gap = new SkillGapAnalysisService.Gap(1L, "Java", (short) 3,
            ProjectSkillRequirement.Importance.REQUIRED, SkillGapAnalysisService.CoverageStatus.COVERED, List.of(userId));
        when(service.analyze(userId, projectId)).thenReturn(new SkillGapAnalysisService.Analysis(projectId, "DRAFT", (short) 4, 1, 3, List.of(gap), List.of()))
            .thenThrow(new ApiException(HttpStatus.CONFLICT, "Project requirements are missing."));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(userId, "n/a"));
        try {
            var mvc = MockMvcBuilders.standaloneSetup(new SkillGapAnalysisController(service))
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setControllerAdvice(new ApiExceptionHandler()).build();
            mvc.perform(get("/projects/{projectId}/skill-gap-analysis", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remainingCapacity").value(3))
                .andExpect(jsonPath("$.required[0].coverageStatus").value("COVERED"))
                .andExpect(jsonPath("$.required[0].satisfyingMemberIds[0]").value(userId.toString()));
            mvc.perform(get("/projects/{projectId}/skill-gap-analysis", projectId))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Project requirements are missing."));
        } finally { SecurityContextHolder.clearContext(); }
    }
}
