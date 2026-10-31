package com.mesh.projects;

import java.util.*;
import java.util.stream.Collectors;

/** Bounded, deterministic search over declared project skill coverage. */
public class TeamOptimizationEngine {
    private static final int BEAM_WIDTH = 12;
    private static final int POOL_LIMIT = 80;

    public enum AvailabilityStatus { COMPATIBLE, UNKNOWN, INCOMPATIBLE }
    public record Requirement(long skillId, String skillName, short minimumProficiency, ProjectSkillRequirement.Importance importance) { }
    public record Person(UUID userId, String displayName, Map<Long, Short> skills, Set<Long> desiredSkills,
                         AvailabilityStatus availabilityStatus, Set<Long> evidenceSupportedSkills) { }
    public record BlockedPair(UUID first, UUID second) {
        public static BlockedPair of(UUID a, UUID b) { return a.compareTo(b) <= 0 ? new BlockedPair(a, b) : new BlockedPair(b, a); }
    }
    public record Input(List<Requirement> requirements, List<Person> currentMembers, List<Person> candidates,
                        Set<BlockedPair> blockedPairs, int targetTeamSize, int alternativeCount) { }
    public record CandidateReason(UUID userId, String displayName, List<Long> covers, List<Long> partialCovers,
                                  List<Long> learningFit, AvailabilityStatus availabilityStatus,
                                  boolean evidenceSupport, String explanation) { }
    public record Alternative(List<CandidateReason> candidates, List<Long> coveredRequiredSkillIds,
                              List<Long> uncoveredRequiredSkillIds, List<Long> coveredPreferredSkillIds,
                              int seatsUnfilled, String explanation) { }

    public List<Alternative> suggest(Input input) {
        if (input.requirements().isEmpty()) throw new IllegalArgumentException("Project requirements are missing.");
        int seats = input.targetTeamSize() - input.currentMembers().size();
        if (seats < 0) throw new IllegalArgumentException("Target team size is below current membership.");
        List<Person> base = List.copyOf(input.currentMembers());
        State initial = new State(List.of(), score(base, input.requirements()));
        if (seats == 0 || allCoverageGoalsMet(base, input.requirements())) return List.of(alternative(initial, input, seats));

        List<Person> ranked = input.candidates().stream()
            .filter(person -> !base.stream().anyMatch(member -> member.userId().equals(person.userId())))
            .filter(person -> person.availabilityStatus() != AvailabilityStatus.INCOMPATIBLE)
            .filter(person -> base.stream().noneMatch(member -> input.blockedPairs().contains(BlockedPair.of(member.userId(), person.userId()))))
            .filter(person -> contributes(person, input.requirements()))
            .sorted(Comparator.<Person>comparingDouble(person -> -score(with(base, person), input.requirements()))
                .thenComparing(person -> person.availabilityStatus() == AvailabilityStatus.COMPATIBLE ? 0 : 1)
                .thenComparing(person -> person.userId().toString()))
            .toList();
        LinkedHashMap<UUID, Person> retained = new LinkedHashMap<>();
        for (Requirement requirement : input.requirements()) {
            ranked.stream().filter(person -> person.skills().getOrDefault(requirement.skillId(), (short) 0) >= requirement.minimumProficiency())
                .findFirst().ifPresent(person -> retained.put(person.userId(), person));
        }
        for (Person person : ranked) {
            if (retained.size() >= POOL_LIMIT) break;
            retained.putIfAbsent(person.userId(), person);
        }
        List<Person> pool = List.copyOf(retained.values());
        if (pool.isEmpty()) return List.of();

        List<State> beam = List.of(initial);
        List<State> terminal = new ArrayList<>();
        for (int depth = 0; depth < seats && !beam.isEmpty(); depth++) {
            Map<String, State> expanded = new HashMap<>();
            for (State state : beam) {
                List<Person> team = withAll(base, state.selected());
                if (allCoverageGoalsMet(team, input.requirements())) { terminal.add(state); continue; }
                for (Person person : pool) {
                    if (state.selected().stream().anyMatch(chosen -> chosen.userId().equals(person.userId()))) continue;
                    if (state.selected().stream().anyMatch(chosen -> input.blockedPairs().contains(BlockedPair.of(chosen.userId(), person.userId())))) continue;
                    double nextScore = score(with(team, person), input.requirements());
                    if (nextScore <= state.score()) continue;
                    List<Person> selected = new ArrayList<>(state.selected());
                    selected.add(person);
                    selected.sort(Comparator.comparing(Person::userId));
                    State next = new State(List.copyOf(selected), nextScore);
                    expanded.put(key(next), next);
                }
            }
            if (expanded.isEmpty()) { terminal.addAll(beam); break; }
            beam = expanded.values().stream().sorted(stateOrder()).limit(BEAM_WIDTH).toList();
            if (depth == seats - 1) terminal.addAll(beam);
        }
        if (terminal.isEmpty()) terminal.addAll(beam);
        List<State> ordered = terminal.stream().distinct().filter(state -> !state.selected().isEmpty()).sorted(stateOrder()).toList();
        List<Alternative> result = new ArrayList<>();
        for (boolean preferDiverse : List.of(true, false)) {
            for (State state : ordered) {
                if (result.size() >= input.alternativeCount()) break;
                Set<UUID> ids = state.selected().stream().map(Person::userId).collect(Collectors.toSet());
                if (result.stream().anyMatch(existing -> existing.candidates().stream().map(CandidateReason::userId).collect(Collectors.toSet()).equals(ids))) continue;
                if (preferDiverse && result.stream().anyMatch(existing -> overlap(existing, ids) > 0.67)) continue;
                result.add(alternative(state, input, seats));
            }
        }
        return List.copyOf(result);
    }

    private double overlap(Alternative alternative, Set<UUID> ids) {
        Set<UUID> other = alternative.candidates().stream().map(CandidateReason::userId).collect(Collectors.toSet());
        Set<UUID> intersection = new HashSet<>(ids);
        intersection.retainAll(other);
        Set<UUID> union = new HashSet<>(ids);
        union.addAll(other);
        return union.isEmpty() ? 1 : intersection.size() / (double) union.size();
    }

    private boolean contributes(Person person, List<Requirement> requirements) {
        return requirements.stream().anyMatch(requirement -> person.skills().getOrDefault(requirement.skillId(), (short) 0) > 0);
    }
    private boolean allCoverageGoalsMet(List<Person> team, List<Requirement> requirements) {
        List<Requirement> required = requirements.stream().filter(r -> r.importance() == ProjectSkillRequirement.Importance.REQUIRED).toList();
        boolean requiredCovered = required.stream().allMatch(r -> team.stream().anyMatch(person -> person.skills().getOrDefault(r.skillId(), (short) 0) >= r.minimumProficiency()));
        boolean preferredCovered = requirements.stream().filter(r -> r.importance() == ProjectSkillRequirement.Importance.PREFERRED)
            .allMatch(r -> team.stream().mapToInt(person -> person.skills().getOrDefault(r.skillId(), (short) 0)).sum() >= r.minimumProficiency());
        return requiredCovered && preferredCovered;
    }
    private double score(List<Person> team, List<Requirement> requirements) {
        List<Requirement> required = requirements.stream().filter(r -> r.importance() == ProjectSkillRequirement.Importance.REQUIRED).toList();
        List<Requirement> preferred = requirements.stream().filter(r -> r.importance() == ProjectSkillRequirement.Importance.PREFERRED).toList();
        double requiredCoverage = required.isEmpty() ? 1 : required.stream().mapToDouble(r ->
            team.stream().mapToDouble(p -> Math.min(1, p.skills().getOrDefault(r.skillId(), (short) 0) / (double) r.minimumProficiency())).max().orElse(0)).average().orElse(0);
        double preferredCoverage = preferred.isEmpty() ? 0 : preferred.stream().mapToDouble(r -> Math.min(1,
            team.stream().mapToDouble(p -> p.skills().getOrDefault(r.skillId(), (short) 0) / (double) r.minimumProficiency()).sum())).average().orElse(0);
        long unfilled = required.stream().filter(r -> team.stream().noneMatch(p -> p.skills().getOrDefault(r.skillId(), (short) 0) >= r.minimumProficiency())).count();
        double availability = team.stream().mapToDouble(p -> p.availabilityStatus() == AvailabilityStatus.COMPATIBLE ? 1 : p.availabilityStatus() == AvailabilityStatus.UNKNOWN ? 0.5 : 0).average().orElse(0);
        double evidence = team.stream().filter(p -> requirements.stream().anyMatch(r -> p.skills().containsKey(r.skillId()) && p.evidenceSupportedSkills().contains(r.skillId()))).count() / (double) Math.max(1, team.size());
        return 1000 * requiredCoverage + 150 * preferredCoverage + 20 * availability + 5 * evidence - 10 * unfilled;
    }
    private Alternative alternative(State state, Input input, int seats) {
        List<Person> team = withAll(input.currentMembers(), state.selected());
        List<Long> coveredRequired = new ArrayList<>(), uncoveredRequired = new ArrayList<>(), coveredPreferred = new ArrayList<>();
        for (Requirement requirement : input.requirements()) {
            boolean covered = team.stream().anyMatch(p -> p.skills().getOrDefault(requirement.skillId(), (short) 0) >= requirement.minimumProficiency());
            if (requirement.importance() == ProjectSkillRequirement.Importance.REQUIRED) (covered ? coveredRequired : uncoveredRequired).add(requirement.skillId());
            else if (team.stream().mapToInt(p -> p.skills().getOrDefault(requirement.skillId(), (short) 0)).sum() >= requirement.minimumProficiency()) coveredPreferred.add(requirement.skillId());
        }
        List<CandidateReason> reasons = state.selected().stream().map(person -> reason(person, input.requirements())).toList();
        String explanation = state.selected().isEmpty() && !uncoveredRequired.isEmpty() ? "No eligible candidate currently closes every required skill gap." :
            state.selected().isEmpty() ? "Current members already cover the required skills or the team is full." :
            uncoveredRequired.isEmpty() ? "These students meet every required proficiency threshold." :
                "Some required proficiency thresholds remain unmet; review the uncovered skills.";
        return new Alternative(reasons, List.copyOf(coveredRequired), List.copyOf(uncoveredRequired), List.copyOf(coveredPreferred), seats - state.selected().size(), explanation);
    }
    private CandidateReason reason(Person person, List<Requirement> requirements) {
        List<Long> covers = new ArrayList<>(), partial = new ArrayList<>(), learning = new ArrayList<>();
        for (Requirement requirement : requirements) {
            short proficiency = person.skills().getOrDefault(requirement.skillId(), (short) 0);
            if (proficiency >= requirement.minimumProficiency()) covers.add(requirement.skillId());
            else if (proficiency > 0) partial.add(requirement.skillId());
            else if (person.desiredSkills().contains(requirement.skillId())) learning.add(requirement.skillId());
        }
        boolean evidence = covers.stream().anyMatch(person.evidenceSupportedSkills()::contains);
        String explanation = !covers.isEmpty() ? "Self-declared proficiency meets a project requirement." :
            !partial.isEmpty() ? "Declares a relevant skill below the requested proficiency." : "Interested in learning a project skill; does not cover a requirement.";
        return new CandidateReason(person.userId(), person.displayName(), List.copyOf(covers), List.copyOf(partial), List.copyOf(learning), person.availabilityStatus(), evidence, explanation);
    }
    private List<Person> with(List<Person> team, Person person) { List<Person> result = new ArrayList<>(team); result.add(person); return result; }
    private List<Person> withAll(List<Person> team, List<Person> selected) { List<Person> result = new ArrayList<>(team); result.addAll(selected); return result; }
    private String key(State state) { return state.selected().stream().map(p -> p.userId().toString()).collect(Collectors.joining("|")); }
    private Comparator<State> stateOrder() { return Comparator.<State>comparingDouble(State::score).reversed().thenComparing(this::key); }
    private record State(List<Person> selected, double score) { }
}
