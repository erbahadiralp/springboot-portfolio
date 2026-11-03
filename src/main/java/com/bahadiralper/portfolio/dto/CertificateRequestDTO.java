package com.bahadiralper.portfolio.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;


@Getter
@Setter
public class CertificateRequestDTO {

    @NotBlank
    @Size(max = 200)
    private String titleTr;

    @NotBlank
    @Size(max = 200)
    private String titleEn;

    @Size(max = 100)
    private String issuer;

    private LocalDate issueDate;

    private String pdfUrl;
}
