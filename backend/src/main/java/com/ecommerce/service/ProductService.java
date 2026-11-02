package com.ecommerce.service;

import com.ecommerce.config.ResourceNotFoundException;
import com.ecommerce.model.Product;
import com.ecommerce.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts(String category, String search, Boolean featured) {
        if (search != null && !search.trim().isEmpty()) {
            return productRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(search.trim(), search.trim());
        }
        if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("All")) {
            return productRepository.findByCategoryIgnoreCase(category.trim());
        }
        if (Boolean.TRUE.equals(featured)) {
            return productRepository.findByFeaturedTrue();
        }
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    public List<String> getAllCategories() {
        return productRepository.findDistinctCategories();
    }

    @Transactional
    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }
}
