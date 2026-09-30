package com.mesh.auth;

import com.mesh.common.ApiException;
import com.mesh.profiles.ProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {
    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final ProfileService profiles;
    private final JwtService jwtService;

    public AuthService(AppUserRepository users, PasswordEncoder passwordEncoder, ProfileService profiles, JwtService jwtService) {
        this.users = users; this.passwordEncoder = passwordEncoder; this.profiles = profiles; this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmail(email)) throw new ApiException(HttpStatus.CONFLICT, "Email is already registered.");
        AppUser user = users.save(new AppUser(email, passwordEncoder.encode(request.password())));
        var profile = profiles.create(user, request.username().trim().toLowerCase(Locale.ROOT), request.displayName().trim());
        return issue(user, profiles.get(profile.getUserId()));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        AppUser user = users.findByEmail(request.email().trim().toLowerCase(Locale.ROOT)).orElseThrow(this::invalidCredentials);
        if (!"ACTIVE".equals(user.getAccountStatus()) || !passwordEncoder.matches(request.password(), user.getPasswordHash())) throw invalidCredentials();
        return issue(user, profiles.get(user.getId()));
    }

    private AuthResponse issue(AppUser user, ProfileService.ProfileResponse profile) {
        JwtService.Token token = jwtService.issue(user.getId());
        return new AuthResponse(token.value(), "Bearer", token.expiresAt(), profile);
    }
    private ApiException invalidCredentials() { return new ApiException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect."); }

    public record RegisterRequest(String displayName, String username, String email, String password) { }
    public record LoginRequest(String email, String password) { }
    public record AuthResponse(String token, String tokenType, java.time.Instant expiresAt, ProfileService.ProfileResponse user) { }
}
