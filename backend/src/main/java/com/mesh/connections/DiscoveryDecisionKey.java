package com.mesh.connections;

import java.io.Serializable;
import java.util.UUID;

public record DiscoveryDecisionKey(UUID actorUserId, UUID targetUserId) implements Serializable { }
