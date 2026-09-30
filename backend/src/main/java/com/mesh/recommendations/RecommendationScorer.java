package com.mesh.recommendations;

import java.util.*;

/** Pure scoring policy. Inputs are data-only so score calculations remain testable and explainable. */
public final class RecommendationScorer {
    public static final double PROJECT_GOALS_WEIGHT = 0.35;
    public static final double COMPLEMENTARY_SKILLS_WEIGHT = 0.25;
    public static final double SKILL_EVIDENCE_WEIGHT = 0.15;
    public static final double AVAILABILITY_WEIGHT = 0.15;
    public static final double SHARED_INTERESTS_WEIGHT = 0.10;

    public Score score(Input viewer, Input candidate) {
        double projectGoals = jaccard(viewer.goalCodes(), candidate.goalCodes());
        double complementarySkills = complementarySkills(viewer.desiredSkillIds(), candidate.selfDeclaredSkillLevels());
        double evidence = clamp(candidate.skillEvidenceSignal());
        double availability = availabilityOverlap(viewer.availability(), candidate.availability());
        double interests = jaccard(viewer.interestIds(), candidate.interestIds());
        double total = 100 * (PROJECT_GOALS_WEIGHT * projectGoals
            + COMPLEMENTARY_SKILLS_WEIGHT * complementarySkills
            + SKILL_EVIDENCE_WEIGHT * evidence
            + AVAILABILITY_WEIGHT * availability
            + SHARED_INTERESTS_WEIGHT * interests);
        return new Score(round(total), new Breakdown(round(projectGoals * 100), round(complementarySkills * 100), round(evidence * 100), round(availability * 100), round(interests * 100)));
    }

    private double complementarySkills(Set<Long> desiredSkills, Map<Long, Short> candidateSkillLevels) {
        if (desiredSkills.isEmpty()) return 0;
        return desiredSkills.stream().mapToDouble(skillId -> Math.min(5, Math.max(0, candidateSkillLevels.getOrDefault(skillId, (short) 0))) / 5.0).average().orElse(0);
    }

    private double availabilityOverlap(List<WeeklyWindow> viewer, List<WeeklyWindow> candidate) {
        int viewerMinutes = viewer.stream().mapToInt(WeeklyWindow::durationMinutes).sum();
        int candidateMinutes = candidate.stream().mapToInt(WeeklyWindow::durationMinutes).sum();
        if (viewerMinutes == 0 || candidateMinutes == 0) return 0;
        int overlap = 0;
        for (WeeklyWindow left : viewer) for (WeeklyWindow right : candidate) {
            if (left.dayOfWeek() == right.dayOfWeek()) overlap += Math.max(0, Math.min(left.endMinute(), right.endMinute()) - Math.max(left.startMinute(), right.startMinute()));
        }
        return clamp((double) overlap / Math.min(viewerMinutes, candidateMinutes));
    }

    private double jaccard(Set<?> left, Set<?> right) {
        if (left.isEmpty() || right.isEmpty()) return 0;
        Set<Object> union = new HashSet<>(left); union.addAll(right);
        Set<Object> intersection = new HashSet<>(left); intersection.retainAll(right);
        return (double) intersection.size() / union.size();
    }
    private double clamp(double value) { return Math.max(0, Math.min(1, value)); }
    private double round(double value) { return Math.round(value * 10.0) / 10.0; }

    public record Input(Set<String> goalCodes, Set<Long> desiredSkillIds, Map<Long, Short> selfDeclaredSkillLevels, double skillEvidenceSignal, List<WeeklyWindow> availability, Set<Long> interestIds) {
        public Input {
            goalCodes = Set.copyOf(goalCodes); desiredSkillIds = Set.copyOf(desiredSkillIds); selfDeclaredSkillLevels = Map.copyOf(selfDeclaredSkillLevels);
            availability = List.copyOf(availability); interestIds = Set.copyOf(interestIds);
        }
    }
    public record WeeklyWindow(short dayOfWeek, short startMinute, short endMinute) {
        int durationMinutes() { return endMinute - startMinute; }
    }
    public record Score(double total, Breakdown breakdown) { }
    public record Breakdown(double projectGoals, double complementarySkills, double skillEvidence, double availabilityOverlap, double sharedInterests) { }
}
