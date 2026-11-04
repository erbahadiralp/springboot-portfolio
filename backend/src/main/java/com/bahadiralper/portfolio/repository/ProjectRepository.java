package com.bahadiralper.portfolio.repository;

import com.bahadiralper.portfolio.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Integer> {

    List<Project> findAllByOrderByDisplayOrderAsc();
    boolean existsByImageUrl(String imageUrl);



}
