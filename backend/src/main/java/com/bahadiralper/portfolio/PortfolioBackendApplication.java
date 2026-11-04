package com.bahadiralper.portfolio;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@EnableScheduling

public class PortfolioBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(PortfolioBackendApplication.class, args);
    }

}
