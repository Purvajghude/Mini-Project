package com.mesh.projects;

import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class TeamOptimizationEngineTest {
    private final TeamOptimizationEngine engine = new TeamOptimizationEngine();
    private final TeamOptimizationEngine.Requirement java = new TeamOptimizationEngine.Requirement(1L, "Java", (short) 4, ProjectSkillRequirement.Importance.REQUIRED);
    private final TeamOptimizationEngine.Requirement design = new TeamOptimizationEngine.Requirement(2L, "Figma", (short) 3, ProjectSkillRequirement.Importance.PREFERRED);
    private final UUID ownerId = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private final UUID expertId = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private final UUID partialId = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private final UUID otherId = UUID.fromString("00000000-0000-0000-0000-000000000004");

    private TeamOptimizationEngine.Person person(UUID id, Map<Long, Short> skills, TeamOptimizationEngine.AvailabilityStatus availability) {
        return new TeamOptimizationEngine.Person(id, id.toString(), skills, Set.of(), availability, Set.of());
    }
    private TeamOptimizationEngine.Input input(List<TeamOptimizationEngine.Requirement> requirements,
                                               List<TeamOptimizationEngine.Person> members, List<TeamOptimizationEngine.Person> candidates,
                                               Set<TeamOptimizationEngine.BlockedPair> blocked, int target) {
        return new TeamOptimizationEngine.Input(requirements, members, candidates, blocked, target, 3);
    }

    @Test void expert_beats_multiple_partial_candidates_and_results_are_repeatable() {
        var owner = person(ownerId, Map.of(), TeamOptimizationEngine.AvailabilityStatus.UNKNOWN);
        var expert = person(expertId, Map.of(1L, (short) 4), TeamOptimizationEngine.AvailabilityStatus.UNKNOWN);
        var partial = person(partialId, Map.of(1L, (short) 2), TeamOptimizationEngine.AvailabilityStatus.COMPATIBLE);
        var other = person(otherId, Map.of(1L, (short) 2), TeamOptimizationEngine.AvailabilityStatus.COMPATIBLE);
        var request = input(List.of(java), List.of(owner), List.of(other, partial, expert), Set.of(), 3);
        var first = engine.suggest(request);
        assertEquals(first, engine.suggest(request));
        assertEquals(expertId, first.get(0).candidates().get(0).userId());
        assertEquals(List.of(1L), first.get(0).coveredRequiredSkillIds());
        assertTrue(first.stream().filter(alt -> alt.candidates().stream().noneMatch(c -> c.userId().equals(expertId)))
            .allMatch(alt -> alt.uncoveredRequiredSkillIds().contains(1L)));
    }

    @Test void existing_member_coverage_returns_zero_additions() {
        var owner = person(ownerId, Map.of(1L, (short) 4), TeamOptimizationEngine.AvailabilityStatus.UNKNOWN);
        var expert = person(expertId, Map.of(1L, (short) 5), TeamOptimizationEngine.AvailabilityStatus.COMPATIBLE);
        var result = engine.suggest(input(List.of(java), List.of(owner), List.of(expert), Set.of(), 3));
        assertEquals(1, result.size());
        assertTrue(result.get(0).candidates().isEmpty());
        assertEquals(2, result.get(0).seatsUnfilled());
    }

    @Test void capacity_and_blocks_limit_alternatives() {
        var owner = person(ownerId, Map.of(), TeamOptimizationEngine.AvailabilityStatus.UNKNOWN);
        var expert = person(expertId, Map.of(1L, (short) 4), TeamOptimizationEngine.AvailabilityStatus.COMPATIBLE);
        var partial = person(partialId, Map.of(1L, (short) 3), TeamOptimizationEngine.AvailabilityStatus.COMPATIBLE);
        var blocked = Set.of(TeamOptimizationEngine.BlockedPair.of(ownerId, expertId));
        var result = engine.suggest(input(List.of(java), List.of(owner), List.of(expert, partial), blocked, 2));
        assertEquals(1, result.size());
        assertEquals(partialId, result.get(0).candidates().get(0).userId());
        assertEquals(List.of(1L), result.get(0).uncoveredRequiredSkillIds());
        assertEquals(0, result.get(0).seatsUnfilled());
    }

    @Test void preferred_skills_and_alternative_diversity_are_reported_separately() {
        var owner = person(ownerId, Map.of(), TeamOptimizationEngine.AvailabilityStatus.UNKNOWN);
        var a = person(expertId, Map.of(1L, (short) 4, 2L, (short) 3), TeamOptimizationEngine.AvailabilityStatus.COMPATIBLE);
        var b = person(partialId, Map.of(1L, (short) 4), TeamOptimizationEngine.AvailabilityStatus.COMPATIBLE);
        var c = person(otherId, Map.of(1L, (short) 4), TeamOptimizationEngine.AvailabilityStatus.UNKNOWN);
        var result = engine.suggest(input(List.of(java, design), List.of(owner), List.of(a, b, c), Set.of(), 2));
        assertEquals(3, result.size());
        assertEquals(expertId, result.get(0).candidates().get(0).userId());
        assertEquals(List.of(2L), result.get(0).coveredPreferredSkillIds());
        assertEquals(3, result.stream().map(alt -> alt.candidates().get(0).userId()).distinct().count());
    }

    @Test void learning_interest_and_github_support_do_not_create_required_coverage() {
        var owner = person(ownerId, Map.of(), TeamOptimizationEngine.AvailabilityStatus.UNKNOWN);
        var learner = new TeamOptimizationEngine.Person(expertId, "Learner", Map.of(), Set.of(1L), TeamOptimizationEngine.AvailabilityStatus.COMPATIBLE, Set.of(1L));
        assertTrue(engine.suggest(input(List.of(java), List.of(owner), List.of(learner), Set.of(), 2)).isEmpty());
    }

    @Test void preferred_only_project_can_still_receive_suggestions() {
        var owner = person(ownerId, Map.of(), TeamOptimizationEngine.AvailabilityStatus.UNKNOWN);
        var candidate = person(expertId, Map.of(2L, (short) 3), TeamOptimizationEngine.AvailabilityStatus.COMPATIBLE);
        var result = engine.suggest(input(List.of(design), List.of(owner), List.of(candidate), Set.of(), 2));
        assertEquals(expertId, result.get(0).candidates().get(0).userId());
        assertEquals(List.of(2L), result.get(0).coveredPreferredSkillIds());
    }

    @Test void preferred_gap_can_be_filled_after_existing_member_covers_required_skill() {
        var owner = person(ownerId, Map.of(1L, (short) 4), TeamOptimizationEngine.AvailabilityStatus.UNKNOWN);
        var candidate = person(expertId, Map.of(2L, (short) 3), TeamOptimizationEngine.AvailabilityStatus.COMPATIBLE);
        var result = engine.suggest(input(List.of(java, design), List.of(owner), List.of(candidate), Set.of(), 2));
        assertEquals(expertId, result.get(0).candidates().get(0).userId());
        assertEquals(List.of(1L), result.get(0).coveredRequiredSkillIds());
        assertEquals(List.of(2L), result.get(0).coveredPreferredSkillIds());
    }

    @Test void bounded_prefilter_retains_a_specialist_for_each_required_skill() {
        var owner = person(ownerId, Map.of(), TeamOptimizationEngine.AvailabilityStatus.UNKNOWN);
        var python = new TeamOptimizationEngine.Requirement(3L, "Python", (short) 4, ProjectSkillRequirement.Importance.REQUIRED);
        List<TeamOptimizationEngine.Person> candidates = new ArrayList<>();
        for (int i = 10; i < 110; i++) {
            UUID id = UUID.fromString(String.format("00000000-0000-0000-0000-%012d", i));
            candidates.add(person(id, Map.of(1L, (short) 4), TeamOptimizationEngine.AvailabilityStatus.UNKNOWN));
        }
        UUID specialistId = UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff");
        candidates.add(person(specialistId, Map.of(3L, (short) 4), TeamOptimizationEngine.AvailabilityStatus.UNKNOWN));
        var result = engine.suggest(input(List.of(java, python), List.of(owner), candidates, Set.of(), 3));
        assertTrue(result.get(0).candidates().stream().anyMatch(candidate -> candidate.userId().equals(specialistId)));
        assertTrue(result.get(0).uncoveredRequiredSkillIds().isEmpty());
    }
}
