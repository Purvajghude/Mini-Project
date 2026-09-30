package com.mesh.profiles;

import com.mesh.skills.Skill;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@IdClass(ProfileDesiredSkillKey.class)
@Table(name = "profile_desired_skill")
public class ProfileDesiredSkill {
    @Id @Column(name = "profile_user_id") private UUID profileUserId;
    @Id @Column(name = "skill_id") private Long skillId;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "skill_id", insertable = false, updatable = false) private Skill skill;
    protected ProfileDesiredSkill() { }
    public ProfileDesiredSkill(UUID profileUserId, Long skillId) { this.profileUserId = profileUserId; this.skillId = skillId; }
    public ProfileDesiredSkill(UUID profileUserId, Long skillId, Skill skill) { this.profileUserId = profileUserId; this.skillId = skillId; this.skill = skill; }
    public UUID getProfileUserId() { return profileUserId; }
    public Skill getSkill() { return skill; }
}
