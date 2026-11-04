package com.bahadiralper.portfolio.dto;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
public class CertificateResponseDTO {

    private Integer id;
    private String titleTr;
    private String titleEn;
    private String issuer;
    private LocalDate issueDate;
    private int displayOrder;
    private String pdfUrl;
}
