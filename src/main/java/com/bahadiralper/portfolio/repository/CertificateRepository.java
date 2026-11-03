package com.bahadiralper.portfolio.repository;

import com.bahadiralper.portfolio.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CertificateRepository extends JpaRepository<Certificate, Integer> {

    List<Certificate> findAllByOrderByDisplayOrderAsc();

    boolean existsByPdfUrl(String pdfUrl);
}
