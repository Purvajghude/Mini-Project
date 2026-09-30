package com.mesh.skills;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@IdClass(ProfileSkillKey.class)
@Table(name = "profile_skill")
public class ProfileSkill {
    @Id @Column(name = "profile_user_id") private UUID profileUserId;
    @Id @Column(name = "skill_id") private Long skillId;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "skill_id", insertable = false, updatable = false) private Skill skill;
    @Column(name = "self_assessed_proficiency", nullable = false) private short selfAssessedProficiency;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    protected ProfileSkill() { }
    public ProfileSkill(UUID profileUserId, Long skillId, short proficiency) { this.profileUserId = profileUserId; this.skillId = skillId; this.selfAssessedProficiency = proficiency; }
    public ProfileSkill(UUID profileUserId, Long skillId, Skill skill, short proficiency) { this.profileUserId = profileUserId; this.skillId = skillId; this.skill = skill; this.selfAssessedProficiency = proficiency; }
    @PrePersist void created() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate void updated() { updatedAt = Instant.now(); }
    public Skill getSkill() { return skill; }
    public UUID getProfileUserId() { return profileUserId; }
    public short getSelfAssessedProficiency() { return selfAssessedProficiency; }
}
