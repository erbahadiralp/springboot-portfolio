package com.bahadiralper.portfolio.service;

import com.bahadiralper.portfolio.dto.EducationRequestDTO;
import com.bahadiralper.portfolio.dto.EducationResponseDTO;
import com.bahadiralper.portfolio.entity.Education;
import com.bahadiralper.portfolio.exception.BadRequestException;
import com.bahadiralper.portfolio.exception.ResourceNotFoundException;
import com.bahadiralper.portfolio.repository.EducationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class EducationService {

    private final EducationRepository educationRepository;
    private final FileUsageService fileUsageService;


    private EducationResponseDTO toResponse(Education education){

        EducationResponseDTO responseDTO = new EducationResponseDTO();

        responseDTO.setId(education.getId());
        responseDTO.setInstitutionTr(education.getInstitutionTr());
        responseDTO.setInstitutionEn(education.getInstitutionEn());
        responseDTO.setDepartmentTr(education.getDepartmentTr());
        responseDTO.setDepartmentEn(education.getDepartmentEn());
        responseDTO.setDescriptionTr(education.getDescriptionTr());
        responseDTO.setDescriptionEn(education.getDescriptionEn());
        responseDTO.setImageUrl(education.getImageUrl());
        responseDTO.setStartDate(education.getStartDate());
        responseDTO.setEndDate(education.getEndDate());

        return responseDTO;
    }

    public List<EducationResponseDTO> getAll(){

        List<Education> educations = educationRepository.findAllByOrderByStartDateDesc();

        List<EducationResponseDTO> educationResponseDTOList = new ArrayList<>();

        for (Education education: educations){
            educationResponseDTOList.add(toResponse(education));
        }

        return educationResponseDTOList;
    }

    public EducationResponseDTO getById(Integer id){
        return toResponse(findEducationById(id));
    }

    private Education findEducationById(Integer id){
        return educationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Eğitim bulunamadı:" + id));
    }

    private Education toEntity(EducationRequestDTO educationRequestDTO){

        Education education = new Education();

        education.setInstitutionTr(educationRequestDTO.getInstitutionTr());
        education.setInstitutionEn(educationRequestDTO.getInstitutionEn());
        education.setDepartmentTr(educationRequestDTO.getDepartmentTr());
        education.setDepartmentEn(educationRequestDTO.getDepartmentEn());
        education.setDescriptionTr(educationRequestDTO.getDescriptionTr());
        education.setDescriptionEn(educationRequestDTO.getDescriptionEn());
        education.setImageUrl(educationRequestDTO.getImageUrl());
        education.setStartDate(educationRequestDTO.getStartDate());
        education.setEndDate(educationRequestDTO.getEndDate());

        return education;
    }

    public EducationResponseDTO create(EducationRequestDTO educationRequestDTO){

        validateDates(educationRequestDTO.getStartDate(), educationRequestDTO.getEndDate());

        Education education = toEntity(educationRequestDTO);

        Education saved = educationRepository.save(education);

        return toResponse(saved);
    }

    public EducationResponseDTO update(Integer id, EducationRequestDTO requestDTO){

        Education entity = findEducationById(id);

        String oldImageUrl = entity.getImageUrl();

        validateDates(requestDTO.getStartDate(), requestDTO.getEndDate());

        entity.setInstitutionTr(requestDTO.getInstitutionTr());
        entity.setInstitutionEn(requestDTO.getInstitutionEn());
        entity.setDepartmentTr(requestDTO.getDepartmentTr());
        entity.setDepartmentEn(requestDTO.getDepartmentEn());
        entity.setDescriptionTr(requestDTO.getDescriptionTr());
        entity.setDescriptionEn(requestDTO.getDescriptionEn());
        entity.setImageUrl(requestDTO.getImageUrl());
        entity.setStartDate(requestDTO.getStartDate());
        entity.setEndDate(requestDTO.getEndDate());

        Education updated = educationRepository.save(entity);

        if (!Objects.equals(oldImageUrl, requestDTO.getImageUrl())){
            fileUsageService.deleteIfUnused(oldImageUrl);

        }

        return toResponse(updated);
    }

    public void delete(Integer id){

        Education entity = findEducationById(id);

        educationRepository.delete(entity);

        fileUsageService.deleteIfUnused(entity.getImageUrl());

    }

    private void validateDates(LocalDate startDate, LocalDate endDate){

        if (endDate != null && endDate.isBefore(startDate)){
            throw new BadRequestException("Bitiş tarihi Başlangıç tarihinden önce olamaz");
        }

    }
}
