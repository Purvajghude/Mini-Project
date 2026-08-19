package com.meshconnect.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "profiles")
public class Profile {
    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id")
    private AppUser user;

    @Column(name = "display_name", nullable = false, length = 80)
    private String displayName;

    @Column(length = 100)
    private String department;

    @Column(name = "year_of_study")
    private Integer yearOfStudy;

    @Column(length = 500)
    private String bio;

    @Column(length = 80)
    private String availability;

    @Column(name = "avatar_key", length = 40)
    private String avatarKey;

    @Column(name = "onboarding_complete", nullable = false)
    private boolean onboardingComplete;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Profile() { }

    public Profile(AppUser user, String displayName) {
        this.user = user;
        this.displayName = displayName;
    }

    @PrePersist
    @PreUpdate
    void touch() { updatedAt = Instant.now(); }

    public Long getUserId() { return userId; }
    public AppUser getUser() { return user; }
    public String getDisplayName() { return displayName; }
    public String getDepartment() { return department; }
    public Integer getYearOfStudy() { return yearOfStudy; }
    public String getBio() { return bio; }
    public String getAvailability() { return availability; }
    public String getAvatarKey() { return avatarKey; }
    public boolean isOnboardingComplete() { return onboardingComplete; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public void setDepartment(String department) { this.department = department; }
    public void setYearOfStudy(Integer yearOfStudy) { this.yearOfStudy = yearOfStudy; }
    public void setBio(String bio) { this.bio = bio; }
    public void setAvailability(String availability) { this.availability = availability; }
    public void setAvatarKey(String avatarKey) { this.avatarKey = avatarKey; }
    public void setOnboardingComplete(boolean onboardingComplete) { this.onboardingComplete = onboardingComplete; }
}
