package com.meshconnect.service;

import com.meshconnect.dto.AuthDto;
import com.meshconnect.dto.ProfileDto;
import com.meshconnect.entity.AppUser;
import com.meshconnect.entity.Profile;
import com.meshconnect.exception.BadRequestException;
import com.meshconnect.exception.ConflictException;
import com.meshconnect.exception.ForbiddenException;
import com.meshconnect.repository.AppUserRepository;
import com.meshconnect.repository.ProfileRepository;
import com.meshconnect.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final AppUserRepository users;
    private final ProfileRepository profiles;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ProfileService profileService;

    public AuthService(AppUserRepository users, ProfileRepository profiles, PasswordEncoder passwordEncoder, JwtService jwtService, ProfileService profileService) {
        this.users = users;
        this.profiles = profiles;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.profileService = profileService;
    }

    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        String username = request.username().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) throw new ConflictException("An account already exists for this email");
        if (users.existsByUsernameIgnoreCase(username)) throw new ConflictException("That username is already taken");
        if (request.password().toLowerCase().contains(username)) throw new BadRequestException("Choose a password that does not contain your username");

        AppUser user = users.save(new AppUser(username, email, passwordEncoder.encode(request.password())));
        profiles.save(new Profile(user, request.displayName().trim()));
        return responseFor(user);
    }

    @Transactional(readOnly = true)
    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        AppUser user = users.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new ForbiddenException("Email or password is incorrect"));
        if (!user.isActive()) throw new ForbiddenException("This account is not active");
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) throw new ForbiddenException("Email or password is incorrect");
        return responseFor(user);
    }

    private AuthDto.AuthResponse responseFor(AppUser user) {
        String token = jwtService.issue(user.getEmail(), user.getId(), user.getRole().name());
        ProfileDto.ProfileResponse profile = profileService.toProfileResponse(user);
        return new AuthDto.AuthResponse(token, profile);
    }
}
