package com.bahadiralper.portfolio.service;

import com.bahadiralper.portfolio.dto.AboutRequestDTO;
import com.bahadiralper.portfolio.dto.AboutResponseDTO;
import com.bahadiralper.portfolio.entity.About;
import com.bahadiralper.portfolio.exception.ResourceNotFoundException;
import com.bahadiralper.portfolio.repository.AboutRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AboutService {

    private final AboutRepository aboutRepository;
    private static final Integer ABOUT_ID = 1;
    private final FileUsageService fileUsageService;


    private AboutResponseDTO toResponse(About about){
        AboutResponseDTO responseDTO = new AboutResponseDTO();

        responseDTO.setFirstName(about.getFirstName());
        responseDTO.setLastName(about.getLastName());
        responseDTO.setAddress(about.getAddress());
        responseDTO.setPhone(about.getPhone());
        responseDTO.setEmail(about.getEmail());
        responseDTO.setDescriptionTr(about.getDescriptionTr());
        responseDTO.setDescriptionEn(about.getDescriptionEn());
        responseDTO.setShortDescriptionTr(about.getShortDescriptionTr());
        responseDTO.setShortDescriptionEn(about.getShortDescriptionEn());
        responseDTO.setImageUrl(about.getImageUrl());
        responseDTO.setCvDocumentUrlTr(about.getCvDocumentUrlTr());
        responseDTO.setCvOriginalFileNameTr(about.getCvOriginalFileNameTr());
        responseDTO.setCvDocumentUrlEn(about.getCvDocumentUrlEn());
        responseDTO.setCvOriginalFileNameEn(about.getCvOriginalFileNameEn());

        return responseDTO;

    }

    private About findAbout(){
        return aboutRepository.findById(ABOUT_ID).orElseThrow(() -> new ResourceNotFoundException("Hakkımda bulunamadı:" + ABOUT_ID));
    }

    public AboutResponseDTO getAbout(){
        return toResponse(findAbout());
    }

    public AboutResponseDTO update(AboutRequestDTO requestDTO){

        About entity = findAbout();

        String oldImageUrl = entity.getImageUrl();
        String oldCvDocumentUrlTr = entity.getCvDocumentUrlTr();
        String oldCvDocumentUrlEn = entity.getCvDocumentUrlEn();


        entity.setFirstName(requestDTO.getFirstName());
        entity.setLastName(requestDTO.getLastName());
        entity.setAddress(requestDTO.getAddress());
        entity.setPhone(requestDTO.getPhone());
        entity.setEmail(requestDTO.getEmail());
        entity.setDescriptionTr(requestDTO.getDescriptionTr());
        entity.setDescriptionEn(requestDTO.getDescriptionEn());
        entity.setShortDescriptionTr(requestDTO.getShortDescriptionTr());
        entity.setShortDescriptionEn(requestDTO.getShortDescriptionEn());
        entity.setImageUrl(requestDTO.getImageUrl());
        entity.setCvDocumentUrlTr(requestDTO.getCvDocumentUrlTr());
        entity.setCvDocumentUrlEn(requestDTO.getCvDocumentUrlEn());
        entity.setCvOriginalFileNameTr(requestDTO.getCvOriginalFileNameTr());
        entity.setCvOriginalFileNameEn(requestDTO.getCvOriginalFileNameEn());

        About updated = aboutRepository.save(entity);

        if (!Objects.equals(oldImageUrl, requestDTO.getImageUrl())){
            fileUsageService.deleteIfUnused(oldImageUrl);
        }

        if (!Objects.equals(oldCvDocumentUrlTr, requestDTO.getCvDocumentUrlTr())){
            fileUsageService.deleteIfUnused(oldCvDocumentUrlTr);

        }

        if (!Objects.equals(oldCvDocumentUrlEn, requestDTO.getCvDocumentUrlEn())){
            fileUsageService.deleteIfUnused(oldCvDocumentUrlEn);

        }
        return toResponse(updated);
    }
}
