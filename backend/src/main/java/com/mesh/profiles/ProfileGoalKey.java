package com.mesh.profiles;

import java.io.Serializable;
import java.util.UUID;

public record ProfileGoalKey(UUID profileUserId, String goalCode) implements Serializable { }
