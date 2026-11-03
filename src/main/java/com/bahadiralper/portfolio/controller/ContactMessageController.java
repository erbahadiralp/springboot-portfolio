package com.bahadiralper.portfolio.controller;


import com.bahadiralper.portfolio.dto.ContactMessageRequestDTO;
import com.bahadiralper.portfolio.dto.ContactMessageResponseDTO;
import com.bahadiralper.portfolio.service.ContactMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact-messages")
@RequiredArgsConstructor
public class ContactMessageController {

    private final ContactMessageService contactMessageService;

    @PostMapping
    public ResponseEntity<ContactMessageResponseDTO> create(@Valid @RequestBody ContactMessageRequestDTO contactMessageRequestDTO){

        ContactMessageResponseDTO contactMessage = contactMessageService.create(contactMessageRequestDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(contactMessage);

    }

    // PagedModel: { content, page: { size, number, totalElements, totalPages } } (sabit JSON biçimi)
    @GetMapping
    public PagedModel<ContactMessageResponseDTO> getAll(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size){
        return new PagedModel<>(contactMessageService.getAll(page, size));
    }

    @GetMapping("/unread-count")
    public long getUnreadCount(){
        return contactMessageService.getUnreadCount();
    }

    @PatchMapping("/{id}/read")
    public ContactMessageResponseDTO read(@PathVariable Integer id){
        return contactMessageService.markAsRead(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id){

        contactMessageService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
