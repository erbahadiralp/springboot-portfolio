package com.bahadiralper.portfolio.dto;

import jakarta.validation.constraints.NotBlank;

import lombok.*;

@Getter
@Setter
public class ExperienceResponsibilityRequestDTO {

    @NotBlank
    private String descriptionTr;

    @NotBlank
    private String descriptionEn;
}
