package com.mesh.profiles;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@IdClass(ProfileInterestKey.class)
@Table(name = "profile_interest")
public class ProfileInterest {
    @Id @Column(name = "profile_user_id") private UUID profileUserId;
    @Id @Column(name = "interest_id") private Long interestId;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "interest_id", insertable = false, updatable = false) private Interest interest;
    protected ProfileInterest() { }
    public ProfileInterest(UUID profileUserId, Long interestId) { this.profileUserId = profileUserId; this.interestId = interestId; }
    public ProfileInterest(UUID profileUserId, Long interestId, Interest interest) { this.profileUserId = profileUserId; this.interestId = interestId; this.interest = interest; }
    public UUID getProfileUserId() { return profileUserId; }
    public Interest getInterest() { return interest; }
}
