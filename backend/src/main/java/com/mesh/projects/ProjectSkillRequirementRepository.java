package com.mesh.projects;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.UUID;

public interface ProjectSkillRequirementRepository extends JpaRepository<ProjectSkillRequirement, Long> {
    @Query("select r from ProjectSkillRequirement r join fetch r.skill where r.projectId = :projectId order by r.skill.name")
    List<ProjectSkillRequirement> findForProject(UUID projectId);
    void deleteByProjectId(UUID projectId);
}
