package com.bahadiralper.portfolio.controller;

import com.bahadiralper.portfolio.dto.ChangePasswordRequestDTO;
import com.bahadiralper.portfolio.dto.LoginRequestDTO;
import com.bahadiralper.portfolio.dto.LoginResponseDTO;
import com.bahadiralper.portfolio.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponseDTO login(@Valid @RequestBody LoginRequestDTO loginRequestDTO){

        return authService.login(loginRequestDTO);
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(Principal principal, @Valid @RequestBody ChangePasswordRequestDTO requestDTO){

        authService.changePassword(principal.getName(), requestDTO);
        return ResponseEntity.noContent().build();

    }
}
