package com.bahadiralper.portfolio.repository;

import com.bahadiralper.portfolio.entity.Education;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EducationRepository extends JpaRepository<Education, Integer> {

    List<Education> findAllByOrderByStartDateDesc();
    boolean existsByImageUrl(String imageUrl);

}
