package com.mesh.projects;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class SkillGapAnalysisController {
    private final SkillGapAnalysisService service;
    public SkillGapAnalysisController(SkillGapAnalysisService service) { this.service = service; }

    @GetMapping("/projects/{projectId}/skill-gap-analysis")
    public SkillGapAnalysisService.Analysis analyze(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId) {
        return service.analyze(userId, projectId);
    }
}
