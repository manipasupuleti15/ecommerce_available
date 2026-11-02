package com.ecommerce.controller;

import com.ecommerce.dto.CartItemRequest;
import com.ecommerce.dto.CartItemUpdateRequest;
import com.ecommerce.dto.CartSummaryDto;
import com.ecommerce.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<CartSummaryDto> getCart(
            @RequestHeader(value = "X-Session-Id", defaultValue = "default-session") String sessionId) {
        return ResponseEntity.ok(cartService.getCartSummary(sessionId));
    }

    @PostMapping("/items")
    public ResponseEntity<CartSummaryDto> addToCart(
            @RequestHeader(value = "X-Session-Id", defaultValue = "default-session") String sessionId,
            @Valid @RequestBody CartItemRequest request) {
        return ResponseEntity.ok(cartService.addToCart(sessionId, request));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartSummaryDto> updateCartItem(
            @RequestHeader(value = "X-Session-Id", defaultValue = "default-session") String sessionId,
            @PathVariable Long itemId,
            @Valid @RequestBody CartItemUpdateRequest request) {
        return ResponseEntity.ok(cartService.updateItemQuantity(sessionId, itemId, request.getQuantity()));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartSummaryDto> removeCartItem(
            @RequestHeader(value = "X-Session-Id", defaultValue = "default-session") String sessionId,
            @PathVariable Long itemId) {
        return ResponseEntity.ok(cartService.removeItem(sessionId, itemId));
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(
            @RequestHeader(value = "X-Session-Id", defaultValue = "default-session") String sessionId) {
        cartService.clearCart(sessionId);
        return ResponseEntity.noContent().build();
    }
}
