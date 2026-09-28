package com.example.moneydi.exchange;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import java.net.URI;
import java.net.http.*;
import java.time.*;

@Component
public class ExchangeRateClient {
    private final ObjectMapper mapper;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
    public ExchangeRateClient(ObjectMapper mapper) { this.mapper = mapper; }

    public ExchangeRate fetch(String currency) throws Exception {
        boolean usd = "USD".equals(currency);
        String url = usd ? "https://api.frankfurter.dev/v2/rate/USD/KRW" : "https://api.upbit.com/v1/ticker?markets=KRW-USDT";
        var request = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(4)).GET().build();
        var response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) throw new IllegalStateException("Rate provider unavailable");
        var json = mapper.readTree(response.body());
        var row = usd ? json : json.get(0);
        if (row == null || !(usd ? "USD".equals(row.path("base").asText()) && "KRW".equals(row.path("quote").asText()) : "KRW-USDT".equals(row.path("market").asText()))) throw new IllegalStateException("Invalid currency pair");
        var rateNode = row.path(usd ? "rate" : "trade_price");
        if (!rateNode.isNumber()) throw new IllegalStateException("Missing rate");
        ExchangeRate result = new ExchangeRate();
        result.setCurrency(currency);
        result.setRate(rateNode.decimalValue());
        if (result.getRate().signum() <= 0 || result.getRate().doubleValue() > 1000000) throw new IllegalStateException("Invalid rate");
        result.setSource(usd ? "Frankfurter" : "Upbit");
        result.setAsOf(usd ? LocalDate.parse(row.path("date").asText()).toString() : Instant.ofEpochMilli(row.path("timestamp").asLong()).toString());
        result.setFetchedAt(Instant.now());
        return result;
    }
}
