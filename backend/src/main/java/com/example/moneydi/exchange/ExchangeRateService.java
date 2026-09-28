package com.example.moneydi.exchange;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExchangeRateService {
    private final ExchangeRateRepository repository;
    private final ExchangeRateClient client;
    private final Map<String, Instant> retryAfter = new HashMap<>();

    // Database cache survives Render restarts. A failed refresh never replaces the last good rate.
    public synchronized ExchangeRate get(String currency) {
        if (!Set.of("USD", "USDT").contains(currency)) throw new IllegalArgumentException("지원하지 않는 통화입니다.");
        ExchangeRate quote = repository.findById(currency).orElse(null);
        Instant now = Instant.now();
        long ttl = "USD".equals(currency) ? 3600 : 60;
        boolean expired = quote == null || quote.getFetchedAt().plusSeconds(ttl).isBefore(now);
        if (expired && !now.isBefore(retryAfter.getOrDefault(currency, Instant.EPOCH))) {
            try {
                quote = repository.save(client.fetch(currency));
                retryAfter.remove(currency);
                expired = false;
            } catch (Exception error) {
                if (error instanceof InterruptedException) Thread.currentThread().interrupt();
                retryAfter.put(currency, now.plusSeconds(60));
            }
        }
        if (quote == null) { quote = new ExchangeRate(); quote.setCurrency(currency); }
        quote.setAvailable(quote.getRate() != null);
        quote.setStale(expired);
        return quote;
    }
    public List<ExchangeRate> list() { return List.of(get("USD"), get("USDT")); }
}
