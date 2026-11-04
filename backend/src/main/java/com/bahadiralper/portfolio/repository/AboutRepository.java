package com.bahadiralper.portfolio.repository;

import com.bahadiralper.portfolio.entity.About;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AboutRepository extends JpaRepository<About, Integer>{

    boolean existsByImageUrl(String imageUrl);
    boolean existsByCvDocumentUrlTr(String cvDocumentUrlTr);
    boolean existsByCvDocumentUrlEn(String cvDocumentUrlEn);


}
