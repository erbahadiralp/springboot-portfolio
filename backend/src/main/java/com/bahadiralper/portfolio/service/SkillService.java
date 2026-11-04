package com.bahadiralper.portfolio.service;

import com.bahadiralper.portfolio.dto.SkillRequestDTO;
import com.bahadiralper.portfolio.dto.SkillResponseDTO;
import com.bahadiralper.portfolio.entity.Skill;
import com.bahadiralper.portfolio.exception.ResourceNotFoundException;
import com.bahadiralper.portfolio.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;

    private SkillResponseDTO toResponse(Skill skill) {
        SkillResponseDTO responseDTO = new SkillResponseDTO();

        responseDTO.setId(skill.getId());
        responseDTO.setNameTr(skill.getNameTr());
        responseDTO.setNameEn(skill.getNameEn());
        responseDTO.setCategory(skill.getCategory());

        return responseDTO;
    }

    public List<SkillResponseDTO> getAll(){

        List<Skill> skills = skillRepository.findAll();

        List<SkillResponseDTO> skillResponseDTOList = new ArrayList<>();

        for (Skill skill: skills){
            skillResponseDTOList.add(toResponse(skill));
        }

        return skillResponseDTOList;
    }

    public SkillResponseDTO getById(Integer id){
        return toResponse(findSkillById(id));

    }

    private Skill findSkillById(Integer id){
        return skillRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Skill bulunamadı:" + id));
    }

    private Skill toEntity(SkillRequestDTO skillRequestDTO){

        Skill skill = new Skill();

        skill.setNameTr(skillRequestDTO.getNameTr());
        skill.setNameEn(skillRequestDTO.getNameEn());
        skill.setCategory(skillRequestDTO.getCategory());


        return skill;
    }

    public SkillResponseDTO create(SkillRequestDTO skillRequestDTO){

        Skill skill = toEntity(skillRequestDTO);
        Skill saved = skillRepository.save(skill);

        return toResponse(saved);

    }

    public SkillResponseDTO update(Integer id, SkillRequestDTO requestDTO){

        Skill entity = findSkillById(id);

        entity.setNameTr(requestDTO.getNameTr());
        entity.setNameEn(requestDTO.getNameEn());
        entity.setCategory(requestDTO.getCategory());

        Skill updated = skillRepository.save(entity);

        return toResponse(updated);
    }

    public void delete(Integer id){

        Skill entity = findSkillById(id);

        skillRepository.delete(entity);

    }




}
