package com.mesh.profiles;

import com.mesh.auth.AppUser;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "student_profile")
public class StudentProfile {
    @Id @Column(name = "user_id") private UUID userId;
    @OneToOne(fetch = FetchType.LAZY, optional = false) @MapsId @JoinColumn(name = "user_id") private AppUser user;
    @Column(nullable = false, unique = true) private String username;
    @Column(name = "display_name", nullable = false) private String displayName;
    private String department;
    @Column(name = "year_of_study") private Short yearOfStudy;
    private String bio;
    @Column(name = "avatar_key") private String avatarKey;
    private String availability;
    @Column(name = "availability_timezone") private String availabilityTimezone;
    @Column(name = "primary_domain") private String primaryDomain;
    @Column(name = "onboarding_complete", nullable = false) private boolean onboardingComplete;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected StudentProfile() { }
    public StudentProfile(AppUser user, String username, String displayName) { this.user = user; this.username = username; this.displayName = displayName; }
    @PrePersist void created() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate void updated() { updatedAt = Instant.now(); }
    public UUID getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getDisplayName() { return displayName; }
    public String getDepartment() { return department; }
    public Short getYearOfStudy() { return yearOfStudy; }
    public String getBio() { return bio; }
    public String getAvatarKey() { return avatarKey; }
    public String getAvailability() { return availability; }
    public String getAvailabilityTimezone() { return availabilityTimezone; }
    public String getPrimaryDomain() { return primaryDomain; }
    public boolean isOnboardingComplete() { return onboardingComplete; }
    public void update(String displayName, String department, Short yearOfStudy, String bio, String avatarKey, String availability, String primaryDomain, boolean onboardingComplete) {
        this.displayName = displayName; this.department = department; this.yearOfStudy = yearOfStudy; this.bio = bio; this.avatarKey = avatarKey;
        this.availability = availability; this.primaryDomain = primaryDomain; this.onboardingComplete = onboardingComplete;
    }
    public void updateAvailabilityTimezone(String timezone) { this.availabilityTimezone = timezone; }
}
