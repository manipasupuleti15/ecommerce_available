package com.ecommerce.service;

import com.ecommerce.config.ResourceNotFoundException;
import com.ecommerce.dto.CheckoutRequest;
import com.ecommerce.dto.OrderItemDto;
import com.ecommerce.dto.OrderResponseDto;
import com.ecommerce.model.CartItem;
import com.ecommerce.model.Order;
import com.ecommerce.model.OrderItem;
import com.ecommerce.model.Product;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class OrderService {

    private static final BigDecimal TAX_RATE = new BigDecimal("0.08");
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("50.00");
    private static final BigDecimal STANDARD_SHIPPING_FEE = new BigDecimal("9.99");

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository, CartItemRepository cartItemRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    public OrderResponseDto checkout(String sessionId, CheckoutRequest request) {
        List<CartItem> cartItems = cartItemRepository.findBySessionId(sessionId);
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cannot checkout with an empty cart");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            if (product.getStock() < cartItem.getQuantity()) {
                throw new IllegalArgumentException("Product '" + product.getName() + "' does not have enough stock. Available: " + product.getStock());
            }

            // Decrement product stock
            product.setStock(product.getStock() - cartItem.getQuantity());
            productRepository.save(product);

            BigDecimal itemSubtotal = product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(itemSubtotal);

            OrderItem orderItem = new OrderItem(
                    null,
                    product,
                    product.getName(),
                    cartItem.getQuantity(),
                    product.getPrice(),
                    itemSubtotal
            );
            orderItems.add(orderItem);
        }

        BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal shippingFee = subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0 ? BigDecimal.ZERO : STANDARD_SHIPPING_FEE;
        BigDecimal total = subtotal.add(tax).add(shippingFee).setScale(2, RoundingMode.HALF_UP);

        String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Order order = new Order(
                orderNumber,
                request.getCustomerName().trim(),
                request.getCustomerEmail().trim(),
                request.getShippingAddress().trim(),
                request.getCity().trim(),
                request.getPostalCode().trim(),
                request.getCountry().trim(),
                request.getPaymentMethod() != null ? request.getPaymentMethod() : "Credit Card (Simulated)",
                subtotal,
                tax,
                shippingFee,
                total
        );

        for (OrderItem oi : orderItems) {
            order.addItem(oi);
        }

        Order savedOrder = orderRepository.save(order);

        // Clear cart items after successful order creation
        cartItemRepository.deleteAll(cartItems);

        return mapToResponseDto(savedOrder);
    }

    @Transactional(readOnly = true)
    public OrderResponseDto getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
        return mapToResponseDto(order);
    }

    @Transactional(readOnly = true)
    public OrderResponseDto getOrderByNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with order number: " + orderNumber));
        return mapToResponseDto(order);
    }

    private OrderResponseDto mapToResponseDto(Order order) {
        List<OrderItemDto> itemDtos = new ArrayList<>();
        for (OrderItem oi : order.getItems()) {
            String imgUrl = oi.getProduct() != null ? oi.getProduct().getImageUrl() : null;
            Long prodId = oi.getProduct() != null ? oi.getProduct().getId() : null;
            itemDtos.add(new OrderItemDto(
                    oi.getId(),
                    prodId,
                    oi.getProductName(),
                    imgUrl,
                    oi.getQuantity(),
                    oi.getUnitPrice(),
                    oi.getSubtotal()
            ));
        }

        return new OrderResponseDto(
                order.getId(),
                order.getOrderNumber(),
                order.getCustomerName(),
                order.getCustomerEmail(),
                order.getShippingAddress(),
                order.getCity(),
                order.getPostalCode(),
                order.getCountry(),
                order.getPaymentMethod(),
                order.getSubtotal(),
                order.getTax(),
                order.getShippingFee(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getCreatedAt(),
                itemDtos
        );
    }
}
