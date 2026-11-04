package com.bahadiralper.portfolio.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Table(name = "projects")
@Entity

public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String titleTr;
    private String titleEn;
    private String descriptionTr;
    private String descriptionEn;
    private String tools;
    private String link;
    private String demoUrl;
    private String imageUrl;
    private int displayOrder;

}
