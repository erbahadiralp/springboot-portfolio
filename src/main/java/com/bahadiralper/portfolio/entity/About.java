package com.bahadiralper.portfolio.entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "abouts")
public class About {


    @Id
    private Integer id;
    private String firstName;
    private String lastName;
    private String address;
    private String phone;
    private String email;
    private String descriptionTr;
    private String descriptionEn;
    private String shortDescriptionTr;
    private String shortDescriptionEn;
    private String imageUrl;
    private String cvDocumentUrlTr;
    private String cvOriginalFileNameTr;
    private String cvDocumentUrlEn;
    private String cvOriginalFileNameEn;
}
