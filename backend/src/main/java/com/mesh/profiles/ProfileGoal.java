package com.mesh.profiles;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@IdClass(ProfileGoalKey.class)
@Table(name = "profile_goal")
public class ProfileGoal {
    @Id @Column(name = "profile_user_id") private UUID profileUserId;
    @Id @Column(name = "goal_code") private String goalCode;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "goal_code", insertable = false, updatable = false) private CollaborationGoal goal;
    protected ProfileGoal() { }
    public ProfileGoal(UUID profileUserId, String goalCode) { this.profileUserId = profileUserId; this.goalCode = goalCode; }
    public ProfileGoal(UUID profileUserId, String goalCode, CollaborationGoal goal) { this.profileUserId = profileUserId; this.goalCode = goalCode; this.goal = goal; }
    public UUID getProfileUserId() { return profileUserId; }
    public CollaborationGoal getGoal() { return goal; }
}
