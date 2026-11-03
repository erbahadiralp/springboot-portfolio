package com.bahadiralper.portfolio.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;



@Service
@Slf4j
public class TurnstileService {

    private final RestClient restClient;


    public TurnstileService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(5));

        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .build();
    }

    @Value("${app.turnstile.secret}")
    private String secret;

    // Virgülle ayrılmış alan adları (ör. "bahadiralper.com,www.bahadiralper.com").
    // Boşsa hostname kontrolü yapılmaz.
    @Value("${app.turnstile.allowed-hostnames:}")
    private String allowedHostnamesValue;

    private Set<String> allowedHostnames;

    @PostConstruct
    void init() {
        allowedHostnames = Arrays.stream(allowedHostnamesValue.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(h -> !h.isEmpty())
                .collect(Collectors.toUnmodifiableSet());

        if (allowedHostnames.isEmpty()) {
            log.warn("Turnstile hostname kontrolü kapalı (app.turnstile.allowed-hostnames boş)");
        }
    }

    private static final String VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    public boolean verify(String token){

        try {
            if (secret.isBlank()){
                log.warn("Turnstile secret tanımlı değil");
                return false;
            }

            if (token.isBlank()){
                return false;
            }

            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();

            form.add("secret", secret);
            form.add("response", token);

            Map result = restClient.post().uri(VERIFY_URL).contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form).retrieve().body(Map.class);

            Boolean isSuccess = Boolean.TRUE.equals(result.get("success"));

            if (!isSuccess){
                log.info("Turnstile doğrulaması reddedildi: {}", result.get("error-codes"));
                return false;
            }

            // Token başka bir sitede üretilmişse reddet
            Object hostname = result.get("hostname");
            if (!allowedHostnames.isEmpty()
                    && (hostname == null || !allowedHostnames.contains(hostname.toString().toLowerCase()))) {
                log.info("Turnstile hostname uyuşmuyor: {}", hostname);
                return false;
            }

            return true;

        } catch (Exception e) {
            log.warn("Turnstile isteği başarısız: {}", e.getMessage());
            return false;
        }

    }

}
