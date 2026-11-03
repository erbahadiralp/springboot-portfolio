package com.bahadiralper.portfolio.controller;

import com.bahadiralper.portfolio.dto.CertificateRequestDTO;
import com.bahadiralper.portfolio.dto.CertificateResponseDTO;
import com.bahadiralper.portfolio.dto.ReorderRequestDTO;
import com.bahadiralper.portfolio.service.CertificateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @GetMapping
    public List<CertificateResponseDTO> getAll(){
        return certificateService.getAll();
    }

    @GetMapping("/{id}")
    public CertificateResponseDTO getById(@PathVariable Integer id){
        return certificateService.getById(id);
    }

    @PostMapping
    public ResponseEntity<CertificateResponseDTO> create(@Valid @RequestBody CertificateRequestDTO certificateRequestDTO){

        CertificateResponseDTO certificate = certificateService.create(certificateRequestDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(certificate);

    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id){

        certificateService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public CertificateResponseDTO update(@PathVariable Integer id, @Valid @RequestBody CertificateRequestDTO certificateRequestDTO){

        CertificateResponseDTO updated = certificateService.update(id, certificateRequestDTO);

        return updated;

    }

    @PutMapping("/order")
    public ResponseEntity<Void> reorderCertificates(@Valid @RequestBody ReorderRequestDTO reorderRequestDTO){

        certificateService.reorder(reorderRequestDTO);

        return ResponseEntity.noContent().build();

    }

}
