package com.example.moneydi.config;

import java.sql.Connection;
import javax.sql.DataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@RequiredArgsConstructor
@Component
public class DatabaseInfoLogger implements CommandLineRunner {

    private final DataSource dataSource;

    @Value("${spring.datasource.url:Not configured}")
    private String dbUrl;

    @Value("${spring.datasource.username:Not configured}")
    private String dbUsername;

    @Override
    public void run(String... args) throws Exception {
        log.info("==============================================");
        log.info("       Database Connection Information        ");
        log.info("==============================================");
        log.info("Properties Config:");
        log.info("- URL: {}", dbUrl);
        log.info("- Username: {}", dbUsername);
        log.info("----------------------------------------------");

        try (Connection connection = dataSource.getConnection()) {
            log.info("Actual Data Source MetaData:");
            log.info("- URL: {}", connection.getMetaData().getURL());
            log.info("- User: {}", connection.getMetaData().getUserName());
            log.info("- Database Product Name: {}", connection.getMetaData().getDatabaseProductName());
            log.info("- Database Product Version: {}", connection.getMetaData().getDatabaseProductVersion());
            log.info("- Driver Name: {}", connection.getMetaData().getDriverName());
            log.info("- Driver Version: {}", connection.getMetaData().getDriverVersion());
        } catch (Exception e) {
            log.error("Failed to acquire database connection or metadata", e);
        }
        log.info("==============================================");
    }
}
