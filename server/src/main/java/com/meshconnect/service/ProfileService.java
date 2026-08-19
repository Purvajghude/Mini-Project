package com.meshconnect.service;

import com.meshconnect.dto.ProfileDto;
import com.meshconnect.entity.AppUser;
import com.meshconnect.entity.Profile;
import com.meshconnect.entity.Skill;
import com.meshconnect.entity.UserSkill;
import com.meshconnect.exception.BadRequestException;
import com.meshconnect.exception.NotFoundException;
import com.meshconnect.repository.ProfileRepository;
import com.meshconnect.repository.SkillRepository;
import com.meshconnect.repository.UserSkillRepository;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {
    private final CurrentUserService currentUser;
    private final ProfileRepository profiles;
    private final SkillRepository skills;
    private final UserSkillRepository userSkills;

    public ProfileService(CurrentUserService currentUser, ProfileRepository profiles, SkillRepository skills, UserSkillRepository userSkills) {
        this.currentUser = currentUser;
        this.profiles = profiles;
        this.skills = skills;
        this.userSkills = userSkills;
    }

    @Transactional(readOnly = true)
    public ProfileDto.ProfileResponse getMine() {
        return toProfileResponse(currentUser.requireUser());
    }

    @Transactional
    public ProfileDto.ProfileResponse updateMine(ProfileDto.UpdateProfileRequest request) {
        AppUser user = currentUser.requireUser();
        Profile profile = requireProfile(user.getId());
        profile.setDisplayName(request.displayName().trim());
        profile.setDepartment(blankToNull(request.department()));
        profile.setYearOfStudy(request.yearOfStudy());
        profile.setBio(blankToNull(request.bio()));
        profile.setAvailability(blankToNull(request.availability()));
        profile.setAvatarKey(blankToNull(request.avatarKey()));
        profile.setOnboardingComplete(request.onboardingComplete());
        return toProfileResponse(user);
    }

    @Transactional
    public ProfileDto.ProfileResponse replaceMySkills(ProfileDto.UpdateSkillsRequest request) {
        AppUser user = currentUser.requireUser();
        Set<Long> uniqueIds = request.skills().stream().map(ProfileDto.SkillInput::skillId).collect(Collectors.toSet());
        if (uniqueIds.size() != request.skills().size()) throw new BadRequestException("Each skill can only be selected once");
        List<Skill> found = skills.findByIdIn(uniqueIds);
        if (found.size() != uniqueIds.size()) throw new BadRequestException("One or more selected skills do not exist");
        Map<Long, Skill> byId = found.stream().collect(Collectors.toMap(Skill::getId, Function.identity()));
        userSkills.deleteByUserId(user.getId());
        userSkills.flush();
        for (ProfileDto.SkillInput skillInput : request.skills()) {
            userSkills.save(new UserSkill(user, byId.get(skillInput.skillId()), skillInput.proficiency()));
        }
        return toProfileResponse(user);
    }

    @Transactional(readOnly = true)
    public List<ProfileDto.SkillCatalogItem> skillCatalog() {
        return skills.findAllByOrderByCategoryAscNameAsc().stream()
                .map(skill -> new ProfileDto.SkillCatalogItem(skill.getId(), skill.getName(), skill.getCategory()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProfileDto.PublicProfileResponse publicProfile(Long userId) {
        return toPublicProfile(requireProfile(userId));
    }

    @Transactional(readOnly = true)
    public Profile requireProfile(Long userId) {
        return profiles.findByUserId(userId).orElseThrow(() -> new NotFoundException("Profile not found"));
    }

    @Transactional(readOnly = true)
    public ProfileDto.ProfileResponse toProfileResponse(AppUser user) {
        Profile profile = requireProfile(user.getId());
        return new ProfileDto.ProfileResponse(
                user.getId(), user.getUsername(), user.getEmail(), profile.getDisplayName(), profile.getDepartment(),
                profile.getYearOfStudy(), profile.getBio(), profile.getAvailability(), profile.getAvatarKey(),
                profile.isOnboardingComplete(), skillItems(user.getId())
        );
    }

    @Transactional(readOnly = true)
    public ProfileDto.PublicProfileResponse toPublicProfile(Profile profile) {
        AppUser user = profile.getUser();
        return new ProfileDto.PublicProfileResponse(
                user.getId(), user.getUsername(), profile.getDisplayName(), profile.getDepartment(), profile.getYearOfStudy(),
                profile.getBio(), profile.getAvailability(), profile.getAvatarKey(), skillItems(user.getId())
        );
    }

    @Transactional(readOnly = true)
    public List<ProfileDto.SkillItem> skillItems(Long userId) {
        return userSkills.findByUserIdOrderBySkillNameAsc(userId).stream()
                .map(item -> new ProfileDto.SkillItem(item.getSkill().getId(), item.getSkill().getName(), item.getSkill().getCategory(), item.getProficiency()))
                .toList();
    }

    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
