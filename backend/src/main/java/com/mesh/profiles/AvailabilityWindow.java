package com.mesh.profiles;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "availability_window")
public class AvailabilityWindow {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "profile_user_id", nullable = false) private UUID profileUserId;
    @Column(name = "day_of_week", nullable = false) private short dayOfWeek;
    @Column(name = "start_minute", nullable = false) private short startMinute;
    @Column(name = "end_minute", nullable = false) private short endMinute;
    protected AvailabilityWindow() { }
    public AvailabilityWindow(UUID profileUserId, short dayOfWeek, short startMinute, short endMinute) { this.profileUserId = profileUserId; this.dayOfWeek = dayOfWeek; this.startMinute = startMinute; this.endMinute = endMinute; }
    public UUID getProfileUserId() { return profileUserId; }
    public short getDayOfWeek() { return dayOfWeek; }
    public short getStartMinute() { return startMinute; }
    public short getEndMinute() { return endMinute; }
}
