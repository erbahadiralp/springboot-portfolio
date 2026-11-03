package com.bahadiralper.portfolio.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Table(name = "experience_responsibilities")
@Entity

public class ExperienceResponsibility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private Integer experienceId;
    private String descriptionTr;
    private String descriptionEn;
    private int displayOrder;


}
