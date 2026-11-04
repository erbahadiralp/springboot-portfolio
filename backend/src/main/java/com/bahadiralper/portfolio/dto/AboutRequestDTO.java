package com.bahadiralper.portfolio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AboutRequestDTO {

    @NotBlank
    @Size(max = 50)
    private String firstName;

    @NotBlank
    @Size(max = 50)
    private String lastName;

    @Size(max = 50)
    private String address;

    @Size(max = 50)
    private String phone;

    @Size(max = 100)
    private String email;

    private String descriptionTr;
    private String descriptionEn;
    private String shortDescriptionTr;
    private String shortDescriptionEn;
    private String imageUrl;
    private String cvDocumentUrlTr;
    private String cvDocumentUrlEn;
    private String cvOriginalFileNameTr;
    private String cvOriginalFileNameEn;
}
