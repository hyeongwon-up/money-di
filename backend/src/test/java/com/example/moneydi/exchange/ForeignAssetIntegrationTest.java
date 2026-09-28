package com.example.moneydi.exchange;

import com.example.moneydi.asset.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import java.math.BigDecimal;
import java.time.Instant;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:foreign-test;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver", "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop", "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
    "spring.jpa.show-sql=false"
})
@AutoConfigureMockMvc
class ForeignAssetIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired AssetRepository assets;
    @Autowired ExchangeRateRepository rates;
    @Autowired ExchangeRateService service;
    @MockBean ExchangeRateClient client;
    @Test void decimalQuantityAndDatabaseCacheSurviveRoundTrip() throws Exception {
        var quote = new ExchangeRate(); quote.setCurrency("USD"); quote.setRate(new BigDecimal("1400.5"));
        quote.setAsOf("2026-09-28"); quote.setSource("test"); quote.setFetchedAt(Instant.now());
        when(client.fetch("USD")).thenReturn(quote);
        mvc.perform(post("/api/assets").contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"test USD\",\"category\":\"SAVINGS\",\"currency\":\"USD\",\"foreignAmount\":\"1.25\",\"amount\":999}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.amount").value(1751));
        assertThat(rates.findById("USD")).isPresent();
        // A new service instance recovers the database cache without requesting the provider again.
        assertThat(new ExchangeRateService(rates, client).get("USD").getRate()).isEqualByComparingTo("1400.5");
        verify(client, times(1)).fetch("USD");
        long id = assets.findAll().get(0).getId();
        mvc.perform(put("/api/assets/" + id).contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"small USD\",\"category\":\"SAVINGS\",\"currency\":\"USD\",\"foreignAmount\":\"0.00000001\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.foreignAmount").value("0.00000001"));
        mvc.perform(get("/api/assets")).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].foreignAmount").value("0.00000001"));
        mvc.perform(put("/api/assets/" + id).contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"KRW again\",\"category\":\"SAVINGS\",\"currency\":\"KRW\",\"amount\":100}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.amount").value(100));
        assertThat(assets.findById(id).orElseThrow().getForeignAmount()).isNull();
    }
}
