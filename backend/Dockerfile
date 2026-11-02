# ==========================================
# Stage 1: Build JAR with Maven
# ==========================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copy pom.xml first so Maven can download dependencies in a cached layer.
# This layer only re-runs if pom.xml changes, not on every source code edit.
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy all source code and compile + package into a fat JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==========================================
# Stage 2: Lightweight JRE Runtime
# ==========================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create a non-root user for security (never run as root in production)
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy only the compiled JAR from the builder stage (no Maven, no source code)
COPY --from=builder /app/target/*.jar app.jar

# Expose Spring Boot's port inside the container
# NOTE: This port is NOT published to the host — only accessible inside Docker networks
EXPOSE 8080

# Start the Spring Boot application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
