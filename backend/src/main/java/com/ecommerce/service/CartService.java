package com.ecommerce.service;

import com.ecommerce.config.ResourceNotFoundException;
import com.ecommerce.dto.CartItemDto;
import com.ecommerce.dto.CartItemRequest;
import com.ecommerce.dto.CartSummaryDto;
import com.ecommerce.model.CartItem;
import com.ecommerce.model.Product;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CartService {

    private static final BigDecimal TAX_RATE = new BigDecimal("0.08"); // 8% sales tax
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("50.00");
    private static final BigDecimal STANDARD_SHIPPING_FEE = new BigDecimal("9.99");

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public CartService(CartItemRepository cartItemRepository, ProductRepository productRepository) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public CartSummaryDto getCartSummary(String sessionId) {
        List<CartItem> items = cartItemRepository.findBySessionId(sessionId);
        List<CartItemDto> itemDtos = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        int totalItems = 0;

        for (CartItem item : items) {
            Product product = item.getProduct();
            BigDecimal itemSubtotal = product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(itemSubtotal);
            totalItems += item.getQuantity();

            CartItemDto dto = new CartItemDto(
                    item.getId(),
                    product.getId(),
                    product.getName(),
                    product.getCategory(),
                    product.getImageUrl(),
                    product.getPrice(),
                    item.getQuantity(),
                    itemSubtotal,
                    product.getStock()
            );
            itemDtos.add(dto);
        }

        BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal shippingFee = BigDecimal.ZERO;
        if (subtotal.compareTo(BigDecimal.ZERO) > 0) {
            shippingFee = subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0 ? BigDecimal.ZERO : STANDARD_SHIPPING_FEE;
        }
        BigDecimal total = subtotal.add(tax).add(shippingFee).setScale(2, RoundingMode.HALF_UP);

        return new CartSummaryDto(itemDtos, subtotal, tax, shippingFee, total, totalItems);
    }

    public CartSummaryDto addToCart(String sessionId, CartItemRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        if (product.getStock() < request.getQuantity()) {
            throw new IllegalArgumentException("Insufficient stock. Available: " + product.getStock());
        }

        Optional<CartItem> existingItemOpt = cartItemRepository.findBySessionIdAndProductId(sessionId, product.getId());

        if (existingItemOpt.isPresent()) {
            CartItem existing = existingItemOpt.get();
            int newQuantity = existing.getQuantity() + request.getQuantity();
            if (newQuantity > product.getStock()) {
                throw new IllegalArgumentException("Cannot add more. Exceeds available stock of " + product.getStock());
            }
            existing.setQuantity(newQuantity);
            cartItemRepository.save(existing);
        } else {
            CartItem newItem = new CartItem(sessionId, product, request.getQuantity());
            cartItemRepository.save(newItem);
        }

        return getCartSummary(sessionId);
    }

    public CartSummaryDto updateItemQuantity(String sessionId, Long itemId, int quantity) {
        CartItem cartItem = cartItemRepository.findBySessionIdAndId(sessionId, itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found: " + itemId));

        if (quantity <= 0) {
            cartItemRepository.delete(cartItem);
        } else {
            Product product = cartItem.getProduct();
            if (quantity > product.getStock()) {
                throw new IllegalArgumentException("Requested quantity exceeds available stock of " + product.getStock());
            }
            cartItem.setQuantity(quantity);
            cartItemRepository.save(cartItem);
        }

        return getCartSummary(sessionId);
    }

    public CartSummaryDto removeItem(String sessionId, Long itemId) {
        CartItem cartItem = cartItemRepository.findBySessionIdAndId(sessionId, itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found: " + itemId));

        cartItemRepository.delete(cartItem);
        return getCartSummary(sessionId);
    }

    public void clearCart(String sessionId) {
        List<CartItem> items = cartItemRepository.findBySessionId(sessionId);
        cartItemRepository.deleteAll(items);
    }
}
