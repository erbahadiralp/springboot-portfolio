package com.bahadiralper.portfolio.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Getter
@Setter
@Table(name = "contact_messages")
@Entity
public class ContactMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String fullName;
    private String email;
    private String subject;
    private String message;
    // Kesin an (TIMESTAMPTZ); sunucunun saat diliminden bağımsız
    private Instant sentDate;

    @Column(name = "is_read")
    private boolean read;
}
