package com.bahadiralper.portfolio.service;

import com.bahadiralper.portfolio.dto.*;
import com.bahadiralper.portfolio.entity.Experience;
import com.bahadiralper.portfolio.entity.ExperienceResponsibility;
import com.bahadiralper.portfolio.exception.BadRequestException;
import com.bahadiralper.portfolio.exception.ResourceNotFoundException;
import com.bahadiralper.portfolio.repository.ExperienceRepository;
import com.bahadiralper.portfolio.repository.ExperienceResponsibilityRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ExperienceService {

    private final ExperienceRepository experienceRepository;
    private final ExperienceResponsibilityRepository experienceResponsibilityRepository;
    private final FileUsageService fileUsageService;


    private ExperienceResponseDTO toResponse(Experience experience){

        ExperienceResponseDTO responseDTO = new ExperienceResponseDTO();

        responseDTO.setId(experience.getId());
        responseDTO.setTitleTr(experience.getTitleTr());
        responseDTO.setTitleEn(experience.getTitleEn());
        responseDTO.setCompany(experience.getCompany());
        responseDTO.setLocationTr(experience.getLocationTr());
        responseDTO.setLocationEn(experience.getLocationEn());
        responseDTO.setImageUrl(experience.getImageUrl());
        responseDTO.setStartDate(experience.getStartDate());
        responseDTO.setEndDate(experience.getEndDate());

        List<ExperienceResponsibility> experienceResponsibilities = experienceResponsibilityRepository.findAllByExperienceIdOrderByDisplayOrderAsc(experience.getId());

        List<ExperienceResponsibilityResponseDTO> experienceResponsibilityResponseDTOList = new ArrayList<>();

        for (ExperienceResponsibility experienceResponsibility: experienceResponsibilities){
            experienceResponsibilityResponseDTOList.add(toResponse(experienceResponsibility));
        }

        responseDTO.setResponsibilities(experienceResponsibilityResponseDTOList);

        return responseDTO;

    }

    private ExperienceResponsibilityResponseDTO toResponse(ExperienceResponsibility experienceResponsibility){
        ExperienceResponsibilityResponseDTO responseDTO = new ExperienceResponsibilityResponseDTO();

        responseDTO.setId(experienceResponsibility.getId());
        responseDTO.setDescriptionTr(experienceResponsibility.getDescriptionTr());
        responseDTO.setDescriptionEn(experienceResponsibility.getDescriptionEn());

        return responseDTO;
    }

    public List<ExperienceResponseDTO> getAll(){

        List<Experience> experiences = experienceRepository.findAllByOrderByStartDateDesc();

        List<ExperienceResponseDTO> experienceResponseDTOList = new ArrayList<>();

        for (Experience experience: experiences){
            experienceResponseDTOList.add(toResponse(experience));
        }

        return experienceResponseDTOList;
    }

    public ExperienceResponseDTO getById(Integer id){
        return toResponse(findExperienceById(id));

    }

    private Experience findExperienceById(Integer id){
        return experienceRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Deneyim bulunamadı:" + id));
    }


    private Experience toEntity(ExperienceRequestDTO experienceRequestDTO){

        Experience experience = new Experience();

        experience.setTitleTr(experienceRequestDTO.getTitleTr());
        experience.setTitleEn(experienceRequestDTO.getTitleEn());
        experience.setCompany(experienceRequestDTO.getCompany());
        experience.setLocationTr(experienceRequestDTO.getLocationTr());
        experience.setLocationEn(experienceRequestDTO.getLocationEn());
        experience.setImageUrl(experienceRequestDTO.getImageUrl());
        experience.setStartDate(experienceRequestDTO.getStartDate());
        experience.setEndDate(experienceRequestDTO.getEndDate());

        return experience;
    }

    private void saveResponsibilities(Integer experienceId, List<ExperienceResponsibilityRequestDTO> experienceResponsibilities){


        for (int i = 0; i < experienceResponsibilities.size(); i++){

            ExperienceResponsibilityRequestDTO dto = experienceResponsibilities.get(i);

            ExperienceResponsibility exResponsibilities = new ExperienceResponsibility();

            exResponsibilities.setExperienceId(experienceId);
            exResponsibilities.setDescriptionTr(dto.getDescriptionTr());
            exResponsibilities.setDescriptionEn(dto.getDescriptionEn());
            exResponsibilities.setDisplayOrder(i);

            experienceResponsibilityRepository.save(exResponsibilities);

        }


    }


    @Transactional
    public ExperienceResponseDTO create(ExperienceRequestDTO experienceRequestDTO){

        validateDates(experienceRequestDTO.getStartDate(), experienceRequestDTO.getEndDate());

        Experience experience = toEntity(experienceRequestDTO);

        Experience saved = experienceRepository.save(experience);

        saveResponsibilities(saved.getId(), experienceRequestDTO.getResponsibilities());

        return toResponse(saved);
    }

    @Transactional
    public ExperienceResponseDTO update(Integer id, ExperienceRequestDTO requestDTO){

        Experience entity = findExperienceById(id);

        String oldImageUrl = entity.getImageUrl();

        validateDates(requestDTO.getStartDate(), requestDTO.getEndDate());

        entity.setTitleTr(requestDTO.getTitleTr());
        entity.setTitleEn(requestDTO.getTitleEn());
        entity.setCompany(requestDTO.getCompany());
        entity.setLocationTr(requestDTO.getLocationTr());
        entity.setLocationEn(requestDTO.getLocationEn());
        entity.setImageUrl(requestDTO.getImageUrl());
        entity.setStartDate(requestDTO.getStartDate());
        entity.setEndDate(requestDTO.getEndDate());

        experienceResponsibilityRepository.deleteByExperienceId(id);

        Experience updated = experienceRepository.save(entity);

        saveResponsibilities(updated.getId(), requestDTO.getResponsibilities());

        if (!Objects.equals(oldImageUrl, requestDTO.getImageUrl())){
            fileUsageService.deleteIfUnused(oldImageUrl);

        }

        return toResponse(updated);

    }

    public void delete(Integer id){

        Experience entity = findExperienceById(id);

        experienceRepository.delete(entity);

        fileUsageService.deleteIfUnused(entity.getImageUrl());

    }

    private void validateDates(LocalDate startDate, LocalDate endDate){

        if (endDate != null && endDate.isBefore(startDate)){
            throw new BadRequestException("Bitiş tarihi Başlangıç tarihinden önce olamaz");
        }

    }
}
