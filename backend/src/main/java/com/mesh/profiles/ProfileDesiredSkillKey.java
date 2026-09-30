package com.mesh.profiles;

import java.io.Serializable;
import java.util.UUID;

public record ProfileDesiredSkillKey(UUID profileUserId, Long skillId) implements Serializable { }
