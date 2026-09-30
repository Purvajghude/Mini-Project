package com.mesh.connections;

import java.io.Serializable;
import java.util.UUID;

public record UserBlockKey(UUID blockerUserId, UUID blockedUserId) implements Serializable { }
