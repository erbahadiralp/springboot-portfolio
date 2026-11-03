package com.bahadiralper.portfolio.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
public class EducationRequestDTO {

    @NotBlank
    @Size(max = 100)
    private String institutionTr;

    @NotBlank
    @Size(max = 100)
    private String institutionEn;

    @Size(max = 100)
    private String departmentTr;

    @Size(max = 100)
    private String departmentEn;

    private String descriptionTr;
    private String descriptionEn;
    private String imageUrl;

    @NotNull
    private LocalDate startDate;

    private LocalDate endDate;


}
