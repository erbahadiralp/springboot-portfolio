package com.bahadiralper.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ADMIN_USERNAME=testadmin",
        "ADMIN_PASSWORD=Test12345!ab",
        "JWT_SECRET=test-secret-test-secret-test-secret-123456"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private String loginAndGetToken() throws Exception {

        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"testadmin\",\"password\":\"Test12345!ab\"}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return body.replaceAll(".*\"token\"\\s*:\\s*\"([^\"]+)\".*", "$1");
    }

    // ---------- giriş ----------

    @Test
    void login_correctCredentials_returnsToken() throws Exception {

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"testadmin\",\"password\":\"Test12345!ab\"}"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("token")));
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"testadmin\",\"password\":\"yanlis-sifre\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ---------- herkese açık uçlar ----------

    @Test
    void publicEndpoints_withoutToken_returnOk() throws Exception {

        mockMvc.perform(get("/api/projects")).andExpect(status().isOk());
        mockMvc.perform(get("/api/skills")).andExpect(status().isOk());
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    @Test
    void contactMessage_withoutTurnstileToken_returns400() throws Exception {

        mockMvc.perform(post("/api/contact-messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Test\",\"email\":\"t@example.com\",\"subject\":\"Test\",\"message\":\"Test\"}"))
                .andExpect(status().isBadRequest());
    }

    // ---------- korumalı uçlar ----------

    @Test
    void protectedEndpoints_withoutToken_return401() throws Exception {

        mockMvc.perform(get("/api/contact-messages")).andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/projects/1")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpoint_withInvalidToken_returns401() throws Exception {

        mockMvc.perform(get("/api/contact-messages")
                        .header("Authorization", "Bearer abc.def.ghi"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpoint_withValidToken_returnsOk() throws Exception {

        String token = loginAndGetToken();

        mockMvc.perform(get("/api/contact-messages")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }
}