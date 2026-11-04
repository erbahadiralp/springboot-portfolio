package com.bahadiralper.portfolio.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
public class SkillRequestDTO {

    @NotBlank
    @Size(max = 100)
    private String nameTr;

    @NotBlank
    @Size(max = 100)
    private String nameEn;

    @NotBlank
    @Size(max = 100)
    private String category;


}
