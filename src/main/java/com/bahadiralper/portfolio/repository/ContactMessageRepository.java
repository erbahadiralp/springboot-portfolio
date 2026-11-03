package com.bahadiralper.portfolio.repository;

import com.bahadiralper.portfolio.entity.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, Integer> {

    long countByReadFalse();

}
