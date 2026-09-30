package com.mesh.recommendations;

import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.assertEquals;

class RecommendationScorerTest {
    private final RecommendationScorer scorer = new RecommendationScorer();

    @Test void applies_the_published_weights_to_each_explainable_signal() {
        var viewer = new RecommendationScorer.Input(Set.of("HACKATHON", "OPEN_SOURCE"), Set.of(1L), Map.of(), 0,
            List.of(new RecommendationScorer.WeeklyWindow((short) 1, (short) 600, (short) 720)), Set.of(10L, 20L));
        var candidate = new RecommendationScorer.Input(Set.of("HACKATHON"), Set.of(), Map.of(1L, (short) 5), 0.6,
            List.of(new RecommendationScorer.WeeklyWindow((short) 1, (short) 660, (short) 780)), Set.of(10L, 30L));

        var score = scorer.score(viewer, candidate);

        assertEquals(62.3, score.total());
        assertEquals(50, score.breakdown().projectGoals());
        assertEquals(100, score.breakdown().complementarySkills());
        assertEquals(60, score.breakdown().skillEvidence());
        assertEquals(50, score.breakdown().availabilityOverlap());
        assertEquals(33.3, score.breakdown().sharedInterests());
    }

    @Test void does_not_invent_scores_when_profile_signals_are_missing() {
        var empty = new RecommendationScorer.Input(Set.of(), Set.of(), Map.of(), 0, List.of(), Set.of());
        assertEquals(0, scorer.score(empty, empty).total());
    }
}
