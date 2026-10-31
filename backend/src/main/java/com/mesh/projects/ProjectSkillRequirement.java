package com.mesh.projects;

import com.mesh.skills.Skill;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_skill_requirement")
public class ProjectSkillRequirement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "project_id", nullable = false) private UUID projectId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "skill_id") private Skill skill;
    @Column(name = "minimum_proficiency", nullable = false) private short minimumProficiency;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Importance importance;
    private String note;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    protected ProjectSkillRequirement() { }
    public ProjectSkillRequirement(UUID projectId, Skill skill, short minimumProficiency, Importance importance, String note) {
        this.projectId = projectId; this.skill = skill; this.minimumProficiency = minimumProficiency; this.importance = importance; this.note = note;
    }
    @PrePersist void created() { createdAt = Instant.now(); updatedAt = createdAt; }
    public Skill getSkill() { return skill; }
    public short getMinimumProficiency() { return minimumProficiency; }
    public Importance getImportance() { return importance; }
    public String getNote() { return note; }
    public enum Importance { REQUIRED, PREFERRED }
}
