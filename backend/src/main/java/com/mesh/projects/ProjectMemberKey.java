package com.mesh.projects;

import java.io.Serializable;
import java.util.UUID;

public record ProjectMemberKey(UUID projectId, UUID userId) implements Serializable { }
