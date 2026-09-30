package com.mesh.profiles;

import jakarta.persistence.*;

@Entity
@Table(name = "interest")
public class Interest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true) private String name;
    protected Interest() { }
    public Long getId() { return id; }
    public String getName() { return name; }
}
