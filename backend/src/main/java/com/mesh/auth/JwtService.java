package com.mesh.auth;

import com.mesh.common.ApiException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {
    private final SecretKey key;
    private final Duration ttl;

    public JwtService(@Value("${mesh.security.jwt-secret}") String encodedSecret, @Value("${mesh.security.jwt-ttl-minutes}") long ttlMinutes) {
        try {
            byte[] secret = Base64.getDecoder().decode(encodedSecret);
            if (secret.length < 32) throw new IllegalArgumentException("JWT key must be at least 32 bytes");
            this.key = Keys.hmacShaKeyFor(secret);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("MESH_JWT_SECRET must be a Base64-encoded secret of at least 32 bytes.", exception);
        }
        this.ttl = Duration.ofMinutes(ttlMinutes);
    }

    public Token issue(UUID userId) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(ttl);
        String value = Jwts.builder().subject(userId.toString()).issuedAt(Date.from(issuedAt)).expiration(Date.from(expiresAt)).signWith(key).compact();
        return new Token(value, expiresAt);
    }

    public UUID parseSubject(String token) {
        try {
            return UUID.fromString(Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject());
        } catch (RuntimeException exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid or expired access token.");
        }
    }

    public record Token(String value, Instant expiresAt) { }
}
