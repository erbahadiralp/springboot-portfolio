package com.bahadiralper.portfolio.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@Table(name = "certificates")
@Entity

public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String titleTr;
    private String titleEn;
    private String issuer;
    private LocalDate issueDate;
    private int displayOrder;
    private String pdfUrl;

}
