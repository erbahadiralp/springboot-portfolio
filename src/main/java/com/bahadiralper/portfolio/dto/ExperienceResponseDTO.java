package com.bahadiralper.portfolio.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class ExperienceResponseDTO {

    private Integer id;
    private String titleTr;
    private String titleEn;
    private String company;
    private String locationTr;
    private String locationEn;
    private String imageUrl;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<ExperienceResponsibilityResponseDTO> responsibilities;


}
