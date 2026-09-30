package com.mesh.recommendations;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.UUID;

@RestController
@Validated
@RequestMapping("/recommendations")
public class RecommendationController {
    private final RecommendationService recommendations;
    public RecommendationController(RecommendationService recommendations) { this.recommendations = recommendations; }
    @GetMapping
    public List<RecommendationService.RecommendationResponse> discover(@AuthenticationPrincipal UUID userId, @RequestParam(defaultValue = "12") @Min(1) @Max(50) int limit) {
        return recommendations.discover(userId, limit);
    }
}
