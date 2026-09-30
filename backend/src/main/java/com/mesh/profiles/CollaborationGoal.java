package com.mesh.profiles;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "collaboration_goal")
public class CollaborationGoal {
    @Id private String code;
    @Column(nullable = false) private String name;
    protected CollaborationGoal() { }
    public String getCode() { return code; }
    public String getName() { return name; }
}
