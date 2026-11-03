package com.bahadiralper.portfolio.repository;

import com.bahadiralper.portfolio.entity.ExperienceResponsibility;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;


public interface ExperienceResponsibilityRepository extends JpaRepository<ExperienceResponsibility, Integer> {

    List<ExperienceResponsibility> findAllByExperienceIdOrderByDisplayOrderAsc(Integer experienceId);

    void deleteByExperienceId(Integer experienceId);

}
