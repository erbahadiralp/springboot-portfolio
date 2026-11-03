package com.bahadiralper.portfolio.service;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secret ;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    public String generateToken(String username){

        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        String token = Jwts.builder().subject(username).issuedAt(now).expiration(expiry).signWith(getSigningKey()).compact();

        return token;
    }

    public String getUsername(String token){
        String username = Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload().getSubject();

        return username;
    }

    public boolean isValid(String token){
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);

            return true;

        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private SecretKey getSigningKey(){

        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);

        return Keys.hmacShaKeyFor(keyBytes);
    }


}
