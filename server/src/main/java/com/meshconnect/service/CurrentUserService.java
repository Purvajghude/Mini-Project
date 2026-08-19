package com.meshconnect.service;

import com.meshconnect.entity.AppUser;
import com.meshconnect.exception.ForbiddenException;
import com.meshconnect.exception.NotFoundException;
import com.meshconnect.repository.AppUserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {
    private final AppUserRepository users;

    public CurrentUserService(AppUserRepository users) { this.users = users; }

    public AppUser requireUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) throw new NotFoundException("Authenticated user was not found");
        AppUser user = users.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new NotFoundException("Authenticated user was not found"));
        // Login checks this, but every other endpoint arrives here instead. Without the
        // check a deactivated account keeps full access until its token expires.
        if (!user.isActive()) throw new ForbiddenException("This account is not active");
        return user;
    }
}
