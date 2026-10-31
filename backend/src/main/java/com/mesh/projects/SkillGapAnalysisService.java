package com.mesh.projects;

import com.mesh.common.ApiException;
import com.mesh.skills.ProfileSkill;
import com.mesh.skills.ProfileSkillRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SkillGapAnalysisService {
    private final ProjectAccessService access;
    private final ProjectMemberRepository members;
    private final ProjectSkillRequirementRepository requirements;
    private final ProfileSkillRepository profileSkills;

    public SkillGapAnalysisService(ProjectAccessService access, ProjectMemberRepository members,
                                   ProjectSkillRequirementRepository requirements, ProfileSkillRepository profileSkills) {
        this.access = access;
        this.members = members;
        this.requirements = requirements;
        this.profileSkills = profileSkills;
    }

    @Transactional(readOnly = true)
    public Analysis analyze(UUID viewerId, UUID projectId) {
        access.requireMember(projectId, viewerId);
        ProjectGroup project = access.requireProject(projectId);
        List<ProjectSkillRequirement> requiredSkills = requirements.findForProject(projectId);
        if (requiredSkills.isEmpty()) throw new ApiException(HttpStatus.CONFLICT, "Project requirements are missing.");
        List<UUID> memberIds = members.findByProjectId(projectId).stream().map(ProjectMember::getUserId).distinct().sorted().toList();
        Map<Long, List<ProfileSkill>> declaredBySkill = memberIds.isEmpty() ? Map.of() :
            profileSkills.findForProfiles(memberIds).stream().collect(Collectors.groupingBy(skill -> skill.getSkill().getId()));
        List<Gap> gaps = requiredSkills.stream().map(requirement -> gap(requirement, declaredBySkill)).toList();
        return new Analysis(projectId, project.getLifecycle(), project.getTargetTeamSize(), memberIds.size(),
            Math.max(0, project.getTargetTeamSize() - memberIds.size()),
            gaps.stream().filter(gap -> gap.importance() == ProjectSkillRequirement.Importance.REQUIRED).toList(),
            gaps.stream().filter(gap -> gap.importance() == ProjectSkillRequirement.Importance.PREFERRED).toList());
    }

    private Gap gap(ProjectSkillRequirement requirement, Map<Long, List<ProfileSkill>> declaredBySkill) {
        Long skillId = requirement.getSkill().getId();
        List<ProfileSkill> declarations = declaredBySkill.getOrDefault(skillId, List.of());
        List<UUID> satisfyingIds = declarations.stream()
            .filter(skill -> skill.getSelfAssessedProficiency() >= requirement.getMinimumProficiency())
            .map(ProfileSkill::getProfileUserId).distinct().sorted().toList();
        CoverageStatus status = !satisfyingIds.isEmpty() ? CoverageStatus.COVERED :
            declarations.isEmpty() ? CoverageStatus.UNCOVERED : CoverageStatus.PARTIAL;
        return new Gap(skillId, requirement.getSkill().getName(), requirement.getMinimumProficiency(),
            requirement.getImportance(), status, satisfyingIds);
    }

    public enum CoverageStatus { COVERED, PARTIAL, UNCOVERED }
    public record Gap(Long skillId, String skillName, short requiredProficiency,
                      ProjectSkillRequirement.Importance importance, CoverageStatus coverageStatus,
                      List<UUID> satisfyingMemberIds) { }
    public record Analysis(UUID projectId, String lifecycle, short targetTeamSize, int currentMemberCount,
                           int remainingCapacity, List<Gap> required, List<Gap> preferred) { }
}
