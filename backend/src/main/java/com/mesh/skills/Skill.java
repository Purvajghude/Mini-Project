package com.mesh.skills;

import jakarta.persistence.*;

@Entity
@Table(name = "skill")
public class Skill {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true) private String name;
    @Column(nullable = false) private String category;
    protected Skill() { }
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
}
