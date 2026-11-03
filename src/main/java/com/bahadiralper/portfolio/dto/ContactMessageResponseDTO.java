package com.bahadiralper.portfolio.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class ContactMessageResponseDTO {

    private Integer id;
    private String fullName;
    private String email;
    private String subject;
    private String message;
    // JSON'da UTC ile yazılır, ör. "2026-11-03T18:38:19.377Z"
    private Instant sentDate;
    private boolean read;
}
