package com.bahadiralper.portfolio.service;

import com.bahadiralper.portfolio.dto.CertificateRequestDTO;
import com.bahadiralper.portfolio.dto.CertificateResponseDTO;
import com.bahadiralper.portfolio.dto.ReorderRequestDTO;
import com.bahadiralper.portfolio.entity.Certificate;
import com.bahadiralper.portfolio.exception.BadRequestException;
import com.bahadiralper.portfolio.exception.ResourceNotFoundException;
import com.bahadiralper.portfolio.repository.CertificateRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final FileUsageService fileUsageService;


    private CertificateResponseDTO toResponse(Certificate certificate) {

        CertificateResponseDTO responseDTO = new CertificateResponseDTO();

        responseDTO.setId(certificate.getId());
        responseDTO.setTitleTr(certificate.getTitleTr());
        responseDTO.setTitleEn(certificate.getTitleEn());
        responseDTO.setIssuer(certificate.getIssuer());
        responseDTO.setIssueDate(certificate.getIssueDate());
        responseDTO.setDisplayOrder(certificate.getDisplayOrder());
        responseDTO.setPdfUrl(certificate.getPdfUrl());

        return responseDTO;
    }

    public List<CertificateResponseDTO> getAll(){

        List<Certificate> certificates = certificateRepository.findAllByOrderByDisplayOrderAsc();

        List<CertificateResponseDTO> certificateResponseDTOList = new ArrayList<>();

        for (Certificate certificate: certificates){
            certificateResponseDTOList.add(toResponse(certificate));
        }

        return certificateResponseDTOList;
    }

    public CertificateResponseDTO getById(Integer id){
        return toResponse(findCertificateById(id));

    }

    private Certificate findCertificateById(Integer id){
        return certificateRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Sertifika bulunamadı:" + id));
    }

    private Certificate toEntity(CertificateRequestDTO certificateRequestDTO){

        Certificate certificate = new Certificate();

        certificate.setTitleTr(certificateRequestDTO.getTitleTr());
        certificate.setTitleEn(certificateRequestDTO.getTitleEn());
        certificate.setIssuer(certificateRequestDTO.getIssuer());
        certificate.setIssueDate(certificateRequestDTO.getIssueDate());
        certificate.setPdfUrl(certificateRequestDTO.getPdfUrl());

        return certificate;
    }

    public CertificateResponseDTO create(CertificateRequestDTO certificateRequestDTO){

        Certificate certificate = toEntity(certificateRequestDTO);

        List<Certificate> certificates = certificateRepository.findAllByOrderByDisplayOrderAsc();

        int nextOrder = 0;


        if (!certificates.isEmpty()){

            Certificate last = certificates.getLast();

            nextOrder = last.getDisplayOrder() + 1;
        }

        certificate.setDisplayOrder(nextOrder);

        Certificate saved = certificateRepository.save(certificate);

        return toResponse(saved);
    }

    public CertificateResponseDTO update(Integer id, CertificateRequestDTO requestDTO){

        Certificate entity = findCertificateById(id);

        String oldImageUrl = entity.getPdfUrl();


        entity.setTitleTr(requestDTO.getTitleTr());
        entity.setTitleEn(requestDTO.getTitleEn());
        entity.setIssuer(requestDTO.getIssuer());
        entity.setIssueDate(requestDTO.getIssueDate());
        entity.setPdfUrl(requestDTO.getPdfUrl());

        Certificate updated = certificateRepository.save(entity);

        if (!Objects.equals(oldImageUrl, requestDTO.getPdfUrl())){
            fileUsageService.deleteIfUnused(oldImageUrl);

        }

        return toResponse(updated);
    }

    public void delete(Integer id){

        Certificate entity = findCertificateById(id);

        certificateRepository.delete(entity);

        fileUsageService.deleteIfUnused(entity.getPdfUrl());

    }

@Transactional
    public void reorder(ReorderRequestDTO reorderRequestDTO){

        Set<Integer> requestedIds = new HashSet<>(reorderRequestDTO.getIds());

        if (requestedIds.size() != reorderRequestDTO.getIds().size()){
            throw new BadRequestException("Tekrar eden id(ler) var.");
        }

        Set<Integer> existingIds = new HashSet<>();

        List<Certificate> existingCertificates = certificateRepository.findAllByOrderByDisplayOrderAsc();

        Map<Integer,Certificate> certificatesById = new HashMap<>();


        for (Certificate certificate: existingCertificates){
            existingIds.add(certificate.getId());
            certificatesById.put(certificate.getId(), certificate);
        }

        if (!requestedIds.equals(existingIds)){
            throw new BadRequestException("Eksik ya da fazla id var");
        }

        for (int i = 0; i < reorderRequestDTO.getIds().size(); i++){

            Integer certificateId = reorderRequestDTO.getIds().get(i);

            Certificate certificate =  certificatesById.get(certificateId);

            certificate.setDisplayOrder(i);

            certificateRepository.save(certificate);

        }
    }
}

