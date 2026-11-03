package com.bahadiralper.portfolio.config;

import com.bahadiralper.portfolio.entity.User;
import com.bahadiralper.portfolio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${ADMIN_USERNAME:}")
    private String adminUsername;

    @Value("${ADMIN_PASSWORD:}")
    private String adminPassword;


    @Override
    public void run(String... args) throws Exception {

        if (adminUsername.isBlank() || adminPassword.isBlank()){
            System.out.println("Kullanıcı adı veya parola boş olamaz");
            return;
        }

        if (userRepository.count() > 0){
            return;
        }

        User user = new User();

        user.setId(1);
        user.setUsername(adminUsername);
        user.setHashedPassword(passwordEncoder.encode(adminPassword));

        userRepository.save(user);


    }
}
