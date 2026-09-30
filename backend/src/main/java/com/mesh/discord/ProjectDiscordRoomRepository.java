package com.mesh.discord;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ProjectDiscordRoomRepository extends JpaRepository<ProjectDiscordRoom, UUID> { }
