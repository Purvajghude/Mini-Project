package com.meshconnect.service;

import com.meshconnect.dto.ProfileDto;
import com.meshconnect.dto.RecommendationDto;
import com.meshconnect.entity.AppUser;
import com.meshconnect.entity.Profile;
import com.meshconnect.entity.UserSkill;
import com.meshconnect.repository.InterestRepository;
import com.meshconnect.repository.MatchRepository;
import com.meshconnect.repository.ProfileRepository;
import com.meshconnect.repository.UserSkillRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Builds the Discover deck.
 *
 * <p>Two distinct stages, kept separate on purpose:
 *
 * <ol>
 *   <li><b>Eligibility</b> - who am I even allowed to see? Excludes myself, inactive
 *       accounts, anyone either of us has blocked, anyone I have already sent or received
 *       interest from, and anyone I am already matched with. This is a correctness and
 *       safety filter, not a ranking one.
 *   <li><b>Ranking</b> - {@link ComplementarityScorer} scores whoever survives. That class
 *       holds no repositories, so the scoring rules can be unit tested without a database.
 * </ol>
 *
 * <p>Candidate skills are loaded with one batched query rather than per candidate, so the
 * endpoint issues a constant number of queries regardless of cohort size.
 */
@Service
public class RecommendationService {

    private static final int MAX_LIMIT = 50;

    private final CurrentUserService currentUser;
    private final ProfileRepository profiles;
    private final UserSkillRepository userSkills;
    private final InterestRepository interests;
    private final MatchRepository matches;
    private final BlockService blockService;
    private final ComplementarityScorer scorer;

    public RecommendationService(CurrentUserService currentUser, ProfileRepository profiles, UserSkillRepository userSkills,
            InterestRepository interests, MatchRepository matches, BlockService blockService, ComplementarityScorer scorer) {
        this.currentUser = currentUser;
        this.profiles = profiles;
        this.userSkills = userSkills;
        this.interests = interests;
        this.matches = matches;
        this.blockService = blockService;
        this.scorer = scorer;
    }

    @Transactional(readOnly = true)
    public List<RecommendationDto.RecommendationResponse> recommendations(int requestedLimit) {
        AppUser me = currentUser.requireUser();
        int limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);

        Map<Long, Integer> mySkills = new HashMap<>();
        Set<String> myCategories = new HashSet<>();
        for (UserSkill item : userSkills.findByUserIdOrderBySkillNameAsc(me.getId())) {
            mySkills.put(item.getSkill().getId(), item.getProficiency());
            myCategories.add(item.getSkill().getCategory());
        }

        List<Profile> candidates = profiles.findByUserActiveTrueAndUserIdNot(me.getId());
        List<Long> candidateIds = candidates.stream().map(Profile::getUserId).toList();
        Map<Long, List<UserSkill>> skillsByUser = new HashMap<>();
        for (UserSkill item : userSkills.findByUserIdIn(candidateIds)) {
            skillsByUser.computeIfAbsent(item.getUser().getId(), unused -> new ArrayList<>()).add(item);
        }

        List<RecommendationDto.RecommendationResponse> result = new ArrayList<>();
        for (Profile candidate : candidates) {
            Long candidateId = candidate.getUserId();
            if (!eligible(me.getId(), candidateId)) continue;

            List<UserSkill> candidateSkills = skillsByUser.getOrDefault(candidateId, List.of());
            ComplementarityScorer.Assessment assessment = scorer.assess(mySkills, myCategories, candidateSkills);
            if (!assessment.recommendable()) continue;

            result.add(new RecommendationDto.RecommendationResponse(
                    candidateId, candidate.getUser().getUsername(), candidate.getDisplayName(),
                    candidate.getDepartment(), candidate.getYearOfStudy(), candidate.getBio(),
                    candidate.getAvailability(), candidate.getAvatarKey(),
                    assessment.score(), assessment.complementarySkills(), assessment.sharedSkills(),
                    assessment.reason(), assessment.breakdown(), skillItems(candidateSkills)));
        }

        return result.stream()
                .sorted(Comparator.comparingDouble(RecommendationDto.RecommendationResponse::score).reversed())
                .limit(limit)
                .toList();
    }

    /** Safety and state filter, applied before anything is scored. */
    private boolean eligible(Long myId, Long candidateId) {
        if (blockService.blockedEitherWay(myId, candidateId)) return false;
        if (interests.existsBySenderIdAndReceiverId(myId, candidateId)) return false;
        if (interests.existsBySenderIdAndReceiverId(candidateId, myId)) return false;
        return matches.findByUserOneIdAndUserTwoId(Math.min(myId, candidateId), Math.max(myId, candidateId)).isEmpty();
    }

    private List<ProfileDto.SkillItem> skillItems(List<UserSkill> skills) {
        return skills.stream()
                .sorted(Comparator.comparingInt(UserSkill::getProficiency).reversed())
                .map(skill -> new ProfileDto.SkillItem(
                        skill.getSkill().getId(), skill.getSkill().getName(), skill.getSkill().getCategory(), skill.getProficiency()))
                .toList();
    }
}
