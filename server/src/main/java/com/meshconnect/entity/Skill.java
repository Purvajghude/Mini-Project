package com.meshconnect.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "skills")
public class Skill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String name;

    @Column(nullable = false, length = 60)
    private String category = "General";

    protected Skill() { }

    public Skill(String name, String category) { this.name = name; this.category = category; }
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public void setName(String name) { this.name = name; }
    public void setCategory(String category) { this.category = category; }
}
