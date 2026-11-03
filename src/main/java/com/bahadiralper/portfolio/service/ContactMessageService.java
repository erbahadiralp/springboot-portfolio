package com.bahadiralper.portfolio.service;

import com.bahadiralper.portfolio.dto.ContactMessageRequestDTO;
import com.bahadiralper.portfolio.dto.ContactMessageResponseDTO;
import com.bahadiralper.portfolio.entity.ContactMessage;
import com.bahadiralper.portfolio.exception.BadRequestException;
import com.bahadiralper.portfolio.exception.ResourceNotFoundException;
import com.bahadiralper.portfolio.repository.ContactMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;


@Service
@RequiredArgsConstructor
public class ContactMessageService {

    private final ContactMessageRepository contactMessageRepository;
    private final TurnstileService turnstileService;

    private ContactMessageResponseDTO toResponse(ContactMessage contactMessage){

        ContactMessageResponseDTO responseDTO = new ContactMessageResponseDTO();

        responseDTO.setId(contactMessage.getId());
        responseDTO.setFullName(contactMessage.getFullName());
        responseDTO.setEmail(contactMessage.getEmail());
        responseDTO.setSubject(contactMessage.getSubject());
        responseDTO.setMessage(contactMessage.getMessage());
        responseDTO.setSentDate(contactMessage.getSentDate());
        responseDTO.setRead(contactMessage.isRead());

        return responseDTO;
    }

    private ContactMessage toEntity(ContactMessageRequestDTO contactMessageRequestDTO){

        ContactMessage contactMessage = new ContactMessage();

        contactMessage.setFullName(contactMessageRequestDTO.getFullName());
        contactMessage.setEmail(contactMessageRequestDTO.getEmail());
        contactMessage.setSubject(contactMessageRequestDTO.getSubject());
        contactMessage.setMessage(contactMessageRequestDTO.getMessage());

        return contactMessage;
    }

    public ContactMessageResponseDTO create(ContactMessageRequestDTO contactMessageRequestDTO){


        if (!turnstileService.verify(contactMessageRequestDTO.getTurnstileToken())){
            throw new BadRequestException("Doğrulama başarısız. Lütfen tekrar deneyin.");
        }

        ContactMessage contactMessage = toEntity(contactMessageRequestDTO);

        contactMessage.setSentDate(Instant.now());
        contactMessage.setRead(false);

        ContactMessage saved = contactMessageRepository.save(contactMessage);

        return toResponse(saved);
    }

    private ContactMessage findMessageById(Integer id){
        return contactMessageRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Mesaj bulunamadı:" + id));
    }

    public ContactMessageResponseDTO markAsRead(Integer id){

        ContactMessage contactMessage = findMessageById(id);

        contactMessage.setRead(true);

        ContactMessage saved = contactMessageRepository.save(contactMessage);

        return toResponse(saved);
    }

    public void delete(Integer id){

        ContactMessage entity = findMessageById(id);

        contactMessageRepository.delete(entity);
    }

    public long getUnreadCount(){

       return contactMessageRepository.countByReadFalse();
    }

    public Page<ContactMessageResponseDTO> getAll(int page, int size){

        if (size > 50){
            size = 50;
        }

        if(size < 1){
            size = 20;
        }

        if (page < 0){
            page = 0;
        }

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC,"sentDate"));

        Page<ContactMessage> findPage = contactMessageRepository.findAll(pageRequest);

        return findPage.map(this::toResponse);
    }


}
