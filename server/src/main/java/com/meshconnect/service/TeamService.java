package com.meshconnect.service;

import com.meshconnect.dto.TeamDto;
import com.meshconnect.entity.AppUser;
import com.meshconnect.entity.Profile;
import com.meshconnect.entity.Skill;
import com.meshconnect.entity.UserSkill;
import com.meshconnect.exception.BadRequestException;
import com.meshconnect.repository.ProfileRepository;
import com.meshconnect.repository.SkillRepository;
import com.meshconnect.repository.UserSkillRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Assembles the smallest useful team that covers what a project needs.
 *
 * <p>Where {@link RecommendationService} answers "who complements <em>me</em>?", this answers
 * "who do we need to build <em>this</em>?" - and those are different questions. Ranking each
 * student individually and taking the top few produces a team that overlaps heavily, because
 * the same strong candidate wins on every axis. What a project actually needs is coverage.
 *
 * <p>This is the classic <b>set cover</b> problem: given the skills the project requires and
 * a pool of students who each cover some subset, choose the fewest students that cover the
 * requirement. Set cover is NP-hard, so an exact search is not on the table for a live
 * request. The greedy choice - repeatedly take whoever closes the most of what is still
 * missing - is the standard approximation, and is provably within a ln(n) factor of the
 * optimal cover. In a cohort where the requirement is a handful of skills, that is
 * comfortably good enough, and it runs in a few milliseconds.
 *
 * <p>Ties are broken by depth (total proficiency across the skills they would cover), so
 * when two students close the same gaps the stronger one is chosen. That matters: covering
 * a skill at level 2 is not the same as covering it at level 5.
 */
@Service
public class TeamService {

    /** A student must be at least this good at a skill to count as covering it. */
    static final int COVERAGE_THRESHOLD = 3;
    private static final int MAX_REQUESTED_SKILLS = 12;

    private final CurrentUserService currentUser;
    private final ProfileRepository profiles;
    private final SkillRepository skills;
    private final UserSkillRepository userSkills;
    private final BlockService blockService;

    public TeamService(CurrentUserService currentUser, ProfileRepository profiles, SkillRepository skills,
            UserSkillRepository userSkills, BlockService blockService) {
        this.currentUser = currentUser;
        this.profiles = profiles;
        this.skills = skills;
        this.userSkills = userSkills;
        this.blockService = blockService;
    }

    @Transactional(readOnly = true)
    public TeamDto.TeamSuggestion suggest(TeamDto.SuggestTeamRequest request) {
        AppUser me = currentUser.requireUser();

        Set<Long> requestedIds = new LinkedHashSet<>(request.skillIds());
        if (requestedIds.size() > MAX_REQUESTED_SKILLS) {
            throw new BadRequestException("Choose at most " + MAX_REQUESTED_SKILLS + " skills for one project");
        }
        List<Skill> requested = skills.findByIdIn(requestedIds);
        if (requested.size() != requestedIds.size()) {
            throw new BadRequestException("One or more selected skills do not exist");
        }
        Map<Long, String> skillNames = new HashMap<>();
        for (Skill skill : requested) skillNames.put(skill.getId(), skill.getName());

        // Anything the requester already covers is not a hiring requirement.
        Set<Long> mine = new HashSet<>();
        for (UserSkill item : userSkills.findByUserIdOrderBySkillNameAsc(me.getId())) {
            if (item.getProficiency() >= COVERAGE_THRESHOLD) mine.add(item.getSkill().getId());
        }
        List<String> youAlreadyCover = requested.stream()
                .filter(skill -> mine.contains(skill.getId()))
                .map(Skill::getName)
                .toList();

        Set<Long> outstanding = new LinkedHashSet<>(requestedIds);
        outstanding.removeAll(mine);

        List<Profile> candidates = profiles.findByUserActiveTrueAndUserIdNot(me.getId());
        Map<Long, List<UserSkill>> skillsByUser = new HashMap<>();
        for (UserSkill item : userSkills.findByUserIdIn(candidates.stream().map(Profile::getUserId).toList())) {
            skillsByUser.computeIfAbsent(item.getUser().getId(), unused -> new ArrayList<>()).add(item);
        }

        // What each eligible candidate could cover of the original requirement.
        Map<Long, Map<Long, Integer>> coverage = new HashMap<>();
        for (Profile candidate : candidates) {
            Long candidateId = candidate.getUserId();
            if (blockService.blockedEitherWay(me.getId(), candidateId)) continue;
            Map<Long, Integer> covers = new HashMap<>();
            for (UserSkill item : skillsByUser.getOrDefault(candidateId, List.of())) {
                Long skillId = item.getSkill().getId();
                if (outstanding.contains(skillId) && item.getProficiency() >= COVERAGE_THRESHOLD) {
                    covers.put(skillId, item.getProficiency());
                }
            }
            if (!covers.isEmpty()) coverage.put(candidateId, covers);
        }

        Map<Long, Profile> profileById = new HashMap<>();
        for (Profile candidate : candidates) profileById.put(candidate.getUserId(), candidate);

        int outstandingAtStart = outstanding.size();
        List<TeamDto.TeamMember> members = new ArrayList<>();
        Set<Long> remaining = new LinkedHashSet<>(outstanding);
        Set<Long> chosen = new HashSet<>();

        while (members.size() < request.size() && !remaining.isEmpty()) {
            Long bestId = null;
            List<Long> bestCovered = List.of();
            int bestDepth = -1;

            for (Map.Entry<Long, Map<Long, Integer>> entry : coverage.entrySet()) {
                if (chosen.contains(entry.getKey())) continue;
                List<Long> covered = entry.getValue().keySet().stream().filter(remaining::contains).toList();
                if (covered.isEmpty()) continue;
                int depth = covered.stream().mapToInt(id -> entry.getValue().get(id)).sum();

                // Most gaps closed wins; equal coverage is settled by who is stronger in them.
                boolean better = covered.size() > bestCovered.size()
                        || (covered.size() == bestCovered.size() && depth > bestDepth);
                if (better) {
                    bestId = entry.getKey();
                    bestCovered = covered;
                    bestDepth = depth;
                }
            }

            if (bestId == null) break; // nobody left covers anything still missing

            Profile profile = profileById.get(bestId);
            List<String> coveredNames = bestCovered.stream().map(skillNames::get).sorted().toList();
            double contribution = outstandingAtStart == 0
                    ? 0
                    : Math.round((bestCovered.size() * 1000.0) / outstandingAtStart) / 10.0;

            members.add(new TeamDto.TeamMember(
                    bestId, profile.getUser().getUsername(), profile.getDisplayName(),
                    profile.getDepartment(), profile.getYearOfStudy(), profile.getAvatarKey(),
                    profile.getAvailability(), coveredNames, contribution));

            chosen.add(bestId);
            bestCovered.forEach(remaining::remove);
        }

        List<String> stillMissing = remaining.stream().map(skillNames::get).sorted().toList();
        int totalRequested = requestedIds.size();
        long coveredCount = totalRequested - stillMissing.size();
        double coveragePercent = totalRequested == 0
                ? 0
                : Math.round((coveredCount * 1000.0) / totalRequested) / 10.0;

        return new TeamDto.TeamSuggestion(
                members, youAlreadyCover, stillMissing, coveragePercent, totalRequested);
    }
}
