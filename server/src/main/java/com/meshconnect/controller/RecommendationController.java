package com.meshconnect.controller;

import com.meshconnect.dto.RecommendationDto;
import com.meshconnect.service.RecommendationService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/recommendations")
public class RecommendationController {
    private final RecommendationService recommendations;
    public RecommendationController(RecommendationService recommendations) { this.recommendations = recommendations; }

    @GetMapping
    public List<RecommendationDto.RecommendationResponse> list(@RequestParam(defaultValue = "12") int limit) { return recommendations.recommendations(limit); }
}
