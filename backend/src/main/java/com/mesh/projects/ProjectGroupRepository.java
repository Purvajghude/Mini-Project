package com.mesh.projects;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ProjectGroupRepository extends JpaRepository<ProjectGroup, UUID> { }
