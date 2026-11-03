package com.bahadiralper.portfolio.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@Table(name = "experiences")
@Entity
public class Experience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String titleTr;
    private String titleEn;
    private String company;
    private String locationTr;
    private String locationEn;
    private String imageUrl;
    private LocalDate startDate;
    private LocalDate endDate;

}
