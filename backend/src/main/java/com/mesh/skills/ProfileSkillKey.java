package com.mesh.skills;

import java.io.Serializable;
import java.util.UUID;

public record ProfileSkillKey(UUID profileUserId, Long skillId) implements Serializable { }
