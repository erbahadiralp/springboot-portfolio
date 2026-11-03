package com.bahadiralper.portfolio.dto;


import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
public class ProjectRequestDTO {

    @NotBlank
    @Size(max = 150)
    private String titleTr;

    @NotBlank
    @Size(max = 150)
    private String titleEn;

    private String descriptionTr;

    private String descriptionEn;

    private String tools;

    private String link;

    private String demoUrl;

    private String imageUrl;
}
