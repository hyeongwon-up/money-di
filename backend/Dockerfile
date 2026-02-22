# Use a base image with JDK 17
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY . .
# Convert line endings if necessary and set permissions
RUN chmod +x gradlew
RUN ./gradlew bootJar

# Use a JRE image for the final container
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
