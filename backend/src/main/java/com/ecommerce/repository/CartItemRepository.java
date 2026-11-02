package com.ecommerce.repository;

import com.ecommerce.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findBySessionId(String sessionId);

    Optional<CartItem> findBySessionIdAndProductId(String sessionId, Long productId);

    Optional<CartItem> findBySessionIdAndId(String sessionId, Long id);

    void deleteBySessionId(String sessionId);

    void deleteBySessionIdAndId(String sessionId, Long id);
}
