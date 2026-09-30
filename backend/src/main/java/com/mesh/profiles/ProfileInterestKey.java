package com.mesh.profiles;

import java.io.Serializable;
import java.util.UUID;

public record ProfileInterestKey(UUID profileUserId, Long interestId) implements Serializable { }
