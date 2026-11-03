package com.bahadiralper.portfolio.dto;

import lombok.*;

@Getter
@Setter
public class ProjectResponseDTO {

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
