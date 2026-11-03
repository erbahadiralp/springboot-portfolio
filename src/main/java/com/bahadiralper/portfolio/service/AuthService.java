package com.bahadiralper.portfolio.service;

import com.bahadiralper.portfolio.dto.ChangePasswordRequestDTO;
import com.bahadiralper.portfolio.dto.LoginRequestDTO;
import com.bahadiralper.portfolio.dto.LoginResponseDTO;
import com.bahadiralper.portfolio.entity.User;
import com.bahadiralper.portfolio.exception.BadRequestException;
import com.bahadiralper.portfolio.exception.UnauthorizedException;
import com.bahadiralper.portfolio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public LoginResponseDTO login(LoginRequestDTO loginRequestDTO){

        User user = userRepository.findByUsername(loginRequestDTO.getUsername()).orElseThrow(() -> new UnauthorizedException("Kullanıcı adı veya şifre hatalı"));

        if (!passwordEncoder.matches(loginRequestDTO.getPassword(), user.getHashedPassword())){
            throw new UnauthorizedException("Kullanıcı adı veya şifre hatalı");
        }

        String token = jwtService.generateToken(user.getUsername());

        LoginResponseDTO responseDTO = new LoginResponseDTO();

        responseDTO.setToken(token);

        return  responseDTO;

    }

    public void changePassword(String username, ChangePasswordRequestDTO requestDTO){

        User user = userRepository.findByUsername(username).orElseThrow(() -> new UnauthorizedException("Kullanıcı adı bulunamadı"));

        if (!passwordEncoder.matches(requestDTO.getCurrentPassword(), user.getHashedPassword())){
            throw new BadRequestException("Mevcut şifre hatalı");
        }

        user.setHashedPassword(passwordEncoder.encode(requestDTO.getNewPassword()));

        userRepository.save(user);
    }
}
