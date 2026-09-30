package com.mesh.profiles;

import java.util.EnumSet;
import java.util.Set;

public enum CollaborationDomain {
    WEB_DEVELOPMENT,
    BACKEND,
    MOBILE,
    DATA_AI,
    UI_UX,
    CYBERSECURITY,
    GAME_DEVELOPMENT,
    PRODUCT;

    public Set<CollaborationDomain> adjacentDomains() {
        return switch (this) {
            case WEB_DEVELOPMENT -> EnumSet.of(BACKEND, UI_UX, MOBILE);
            case BACKEND -> EnumSet.of(WEB_DEVELOPMENT, DATA_AI, CYBERSECURITY);
            case MOBILE -> EnumSet.of(WEB_DEVELOPMENT, UI_UX, BACKEND);
            case DATA_AI -> EnumSet.of(BACKEND, PRODUCT, CYBERSECURITY);
            case UI_UX -> EnumSet.of(WEB_DEVELOPMENT, MOBILE, PRODUCT);
            case CYBERSECURITY -> EnumSet.of(BACKEND, DATA_AI, WEB_DEVELOPMENT);
            case GAME_DEVELOPMENT -> EnumSet.of(WEB_DEVELOPMENT, UI_UX, DATA_AI);
            case PRODUCT -> EnumSet.of(UI_UX, WEB_DEVELOPMENT, DATA_AI);
        };
    }
}
