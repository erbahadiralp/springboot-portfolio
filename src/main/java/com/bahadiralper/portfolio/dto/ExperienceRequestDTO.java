package com.bahadiralper.portfolio.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class ExperienceRequestDTO {

    @NotBlank
    @Size(max = 100)
    private String titleTr;

    @NotBlank
    @Size(max = 100)
    private String titleEn;

    @NotBlank
    @Size(max = 100)
    private String company;

    @Size(max = 100)
    private String locationTr;

    @Size(max = 100)
    private String locationEn;
    private String imageUrl;

    @NotNull
    private LocalDate startDate;
    private LocalDate endDate;

    @NotNull
    @Valid
    private List<ExperienceResponsibilityRequestDTO> responsibilities;


}
