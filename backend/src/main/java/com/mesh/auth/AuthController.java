package com.mesh.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) { this.authService = authService; }
    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
    public AuthService.AuthResponse register(@Valid @RequestBody RegisterBody body) {
        return authService.register(new AuthService.RegisterRequest(body.displayName(), body.username(), body.email(), body.password()));
    }
    @PostMapping("/login")
    public AuthService.AuthResponse login(@Valid @RequestBody LoginBody body) { return authService.login(new AuthService.LoginRequest(body.email(), body.password())); }

    public record RegisterBody(@NotBlank @Size(max = 100) String displayName, @NotBlank @Pattern(regexp = "[A-Za-z0-9][A-Za-z0-9._-]{2,39}", message = "must be 3-40 characters using letters, numbers, dots, underscores, or hyphens") String username, @NotBlank @Email @Size(max = 254) String email, @NotBlank @Size(min = 8, max = 72) String password) { }
    public record LoginBody(@NotBlank @Email @Size(max = 254) String email, @NotBlank @Size(max = 72) String password) { }
}
