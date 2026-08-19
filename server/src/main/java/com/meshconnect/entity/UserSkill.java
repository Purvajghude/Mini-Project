package com.meshconnect.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "user_skills", uniqueConstraints = @UniqueConstraint(name = "uq_user_skill", columnNames = {"user_id", "skill_id"}))
public class UserSkill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Column(nullable = false)
    private int proficiency;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected UserSkill() { }
    public UserSkill(AppUser user, Skill skill, int proficiency) {
        this.user = user; this.skill = skill; this.proficiency = proficiency;
    }
    @PrePersist void onCreate() { createdAt = Instant.now(); }
    public Long getId() { return id; }
    public AppUser getUser() { return user; }
    public Skill getSkill() { return skill; }
    public int getProficiency() { return proficiency; }
    public void setProficiency(int proficiency) { this.proficiency = proficiency; }
}
