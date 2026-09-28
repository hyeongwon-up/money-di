package com.example.moneydi.exchange;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ExchangeRateServiceTest {
    ExchangeRateRepository repository = mock(ExchangeRateRepository.class);
    ExchangeRateClient client = mock(ExchangeRateClient.class);
    ExchangeRateService service = new ExchangeRateService(repository, client);
    ExchangeRate quote(int age) {
        var quote = new ExchangeRate(); quote.setCurrency("USDT"); quote.setRate(new BigDecimal("1400.5"));
        quote.setFetchedAt(Instant.now().minusSeconds(age)); return quote;
    }
    @Test void cachedRateSurvivesServiceRestartWithoutNetwork() {
        when(repository.findById("USDT")).thenReturn(Optional.of(quote(10)));
        assertThat(new ExchangeRateService(repository, client).get("USDT").isAvailable()).isTrue();
        verifyNoInteractions(client);
    }
    @Test void failureRetainsLastQuoteAndBacksOff() throws Exception {
        when(repository.findById("USDT")).thenReturn(Optional.of(quote(120)));
        when(client.fetch("USDT")).thenThrow(new RuntimeException("offline"));
        assertThat(service.get("USDT").getRate()).isEqualByComparingTo("1400.5");
        assertThat(service.get("USDT").isStale()).isTrue();
        verify(client, times(1)).fetch("USDT"); verify(repository, never()).save(any());
    }
    @Test void firstFailureIsUnavailableNotZero() throws Exception {
        when(repository.findById("USD")).thenReturn(Optional.empty());
        when(client.fetch("USD")).thenThrow(new RuntimeException("offline"));
        var result = service.get("USD");
        assertThat(result.isAvailable()).isFalse(); assertThat(result.getRate()).isNull();
    }
    @Test void expiredRateRefreshesAndPersists() throws Exception {
        when(repository.findById("USDT")).thenReturn(Optional.of(quote(120)));
        when(client.fetch("USDT")).thenReturn(quote(0));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        assertThat(service.get("USDT").isStale()).isFalse(); verify(repository).save(any());
    }
}
