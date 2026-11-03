package com.bahadiralper.portfolio.dto;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
public class EducationResponseDTO {

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
