package com.bahadiralper.portfolio.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Table(name = "educations")
@Entity

public class Education {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String institutionTr;
    private String institutionEn;
    private String departmentTr;
    private String departmentEn;
    private String descriptionTr;
    private String descriptionEn;
    private String imageUrl;
    private LocalDate startDate;
    private LocalDate endDate;

}
