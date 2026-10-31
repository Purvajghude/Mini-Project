package com.mesh.projects;

import com.mesh.common.ApiException;
import com.mesh.skills.Skill;
import com.mesh.skills.SkillRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProjectRequirementsService {
    private final ProjectAccessService access;
    private final ProjectMemberRepository members;
    private final ProjectSkillRequirementRepository requirements;
    private final SkillRepository skills;
    public ProjectRequirementsService(ProjectAccessService access, ProjectMemberRepository members, ProjectSkillRequirementRepository requirements, SkillRepository skills) {
        this.access = access; this.members = members; this.requirements = requirements; this.skills = skills;
    }
    @Transactional(readOnly = true)
    public Response get(UUID userId, UUID projectId) {
        access.requireMember(projectId, userId);
        return response(access.requireProject(projectId));
    }
    @Transactional
    public Response replace(UUID ownerId, UUID projectId, ReplaceRequest request) {
        access.requireOwner(projectId, ownerId);
        ProjectGroup project = access.requireProject(projectId);
        if (request.targetTeamSize() < members.findByProjectId(projectId).size()) throw new ApiException(HttpStatus.CONFLICT, "Target team size cannot be smaller than current membership.");
        if (request.lifecycle() == null || !Set.of("DRAFT", "RECRUITING", "ACTIVE", "ARCHIVED").contains(request.lifecycle())) throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid project lifecycle.");
        Map<String, Set<String>> allowedTransitions = Map.of(
            "DRAFT", Set.of("DRAFT", "RECRUITING"),
            "RECRUITING", Set.of("RECRUITING", "ACTIVE"),
            "ACTIVE", Set.of("ACTIVE", "ARCHIVED"),
            "ARCHIVED", Set.of("ARCHIVED"));
        if (!allowedTransitions.getOrDefault(project.getLifecycle(), Set.of()).contains(request.lifecycle())) throw new ApiException(HttpStatus.CONFLICT, "Invalid project lifecycle transition.");
        if (("RECRUITING".equals(request.lifecycle()) || "ACTIVE".equals(request.lifecycle())) && request.requirements().isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "Recruiting and active projects need at least one requirement.");
        Set<Long> ids = request.requirements().stream().map(RequirementInput::skillId).collect(Collectors.toSet());
        if (ids.size() != request.requirements().size()) throw new ApiException(HttpStatus.BAD_REQUEST, "Each skill may appear only once.");
        Map<Long, Skill> catalog = skills.findAllById(ids).stream().collect(Collectors.toMap(Skill::getId, skill -> skill));
        if (catalog.size() != ids.size()) throw new ApiException(HttpStatus.BAD_REQUEST, "One or more skills do not exist.");
        requirements.deleteByProjectId(projectId);
        requirements.flush();
        for (RequirementInput input : request.requirements()) requirements.save(new ProjectSkillRequirement(projectId, catalog.get(input.skillId()), input.minimumProficiency(), input.importance(), input.note() == null ? null : input.note().trim()));
        project.setRequirementsMetadata(request.targetTeamSize(), request.lifecycle());
        requirements.flush();
        return response(project);
    }
    private Response response(ProjectGroup project) {
        List<RequirementResponse> rows = requirements.findForProject(project.getId()).stream().map(row -> new RequirementResponse(row.getSkill().getId(), row.getSkill().getName(), row.getMinimumProficiency(), row.getImportance(), row.getNote())).toList();
        return new Response(project.getId(), project.getLifecycle(), project.getTargetTeamSize(), rows);
    }
    public record RequirementInput(Long skillId, short minimumProficiency, ProjectSkillRequirement.Importance importance, String note) { }
    public record ReplaceRequest(short targetTeamSize, String lifecycle, List<RequirementInput> requirements) { }
    public record RequirementResponse(Long skillId, String skillName, short minimumProficiency, ProjectSkillRequirement.Importance importance, String note) { }
    public record Response(UUID projectId, String lifecycle, short targetTeamSize, List<RequirementResponse> requirements) { }
}
