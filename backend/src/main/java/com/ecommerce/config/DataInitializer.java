package com.ecommerce.config;

import com.ecommerce.model.Product;
import com.ecommerce.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private final ProductRepository productRepository;

    public DataInitializer(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        if (productRepository.count() == 0) {
            log.info("Database is empty. Seeding initial e-commerce products...");

            List<Product> products = Arrays.asList(
                new Product(
                    null,
                    "Sony WH-1000XM5 Wireless Headphones",
                    "Industry-leading noise cancellation with two processors and 8 microphones. Exceptional sound quality with Hi-Res audio, 30-hour battery life, and ultra-comfortable lightweight design.",
                    new BigDecimal("399.99"),
                    "Audio",
                    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
                    45,
                    4.8,
                    128,
                    true
                ),
                new Product(
                    null,
                    "Apple Watch Ultra 2",
                    "The most rugged and capable Apple Watch. Designed for outdoor adventure and endurance workouts with a lightweight titanium case, precision dual-frequency GPS, and up to 36 hours of battery life.",
                    new BigDecimal("799.00"),
                    "Wearables",
                    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
                    28,
                    4.9,
                    94,
                    true
                ),
                new Product(
                    null,
                    "Keychron Q1 Pro Mechanical Keyboard",
                    "Custom full-metal wireless mechanical keyboard with QMK/VIA support, double-gasket design, hot-swappable switches, and programmable rotary knob for productivity and gaming.",
                    new BigDecimal("199.50"),
                    "Electronics",
                    "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
                    60,
                    4.7,
                    73,
                    false
                ),
                new Product(
                    null,
                    "Logitech MX Master 3S Wireless Mouse",
                    "Ergonomic wireless performance mouse with quiet clicks, 8K DPI any-surface tracking, MagSpeed electromagnetic scrolling, and multi-device flow cross-computer control.",
                    new BigDecimal("99.99"),
                    "Accessories",
                    "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80",
                    85,
                    4.9,
                    340,
                    true
                ),
                new Product(
                    null,
                    "Dell UltraSharp 27\" 4K USB-C Hub Monitor",
                    "IPS Black technology with 2000:1 contrast ratio, 100% sRGB and 98% DCI-P3 color coverage. Features 90W USB-C power delivery, RJ45 Ethernet, and sleek borderless design.",
                    new BigDecimal("579.00"),
                    "Electronics",
                    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80",
                    15,
                    4.6,
                    52,
                    false
                ),
                new Product(
                    null,
                    "Bose SoundLink Flex Bluetooth Speaker",
                    "Waterproof and dustproof portable Bluetooth speaker (IP67) with PositionIQ technology that automatically optimizes sound orientation. Deep, immersive audio anywhere.",
                    new BigDecimal("149.00"),
                    "Audio",
                    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80",
                    72,
                    4.7,
                    210,
                    false
                ),
                new Product(
                    null,
                    "Peak Design Everyday Backpack 20L",
                    "Iconic award-winning backpack for everyday and photo carry. Weatherproof 100% recycled 400D nylon canvas shell, MagLatch hardware, and versatile FlexFold dividers.",
                    new BigDecimal("279.95"),
                    "Accessories",
                    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
                    35,
                    4.8,
                    88,
                    true
                ),
                new Product(
                    null,
                    "Anker Prime 20,000mAh Power Bank (200W)",
                    "High-capacity portable charger with 200W total output, smart digital display showing live charging speeds, and 100W rapid recharge for laptops, phones, and tablets.",
                    new BigDecimal("129.99"),
                    "Accessories",
                    "https://images.unsplash.com/photo-1609592807664-8840c83a15dc?w=800&auto=format&fit=crop&q=80",
                    110,
                    4.6,
                    65,
                    false
                ),
                new Product(
                    null,
                    "Kindle Paperwhite Signature Edition (32 GB)",
                    "Features a 6.8\" glare-free 300 ppi display, auto-adjusting front light, wireless charging, up to 10 weeks of battery life, and waterproof IPX8 rating.",
                    new BigDecimal("189.99"),
                    "Electronics",
                    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
                    50,
                    4.7,
                    312,
                    false
                ),
                new Product(
                    null,
                    "Garmin Forerunner 965 GPS Smartwatch",
                    "Premium running and triathlon smartwatch with brilliant 1.4\" AMOLED touchscreen display, titanium bezel, advanced training metrics, and full-color built-in maps.",
                    new BigDecimal("599.99"),
                    "Wearables",
                    "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80",
                    20,
                    4.8,
                    47,
                    false
                )
            );

            productRepository.saveAll(products);
            log.info("Successfully seeded {} products into MySQL database.", products.size());
        } else {
            log.info("Database already contains {} products. Skipping seeding.", productRepository.count());
        }
    }
}
