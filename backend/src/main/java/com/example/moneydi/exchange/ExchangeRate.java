package com.example.moneydi.exchange;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Getter @Setter @NoArgsConstructor
public class ExchangeRate {
    @Id private String currency;
    @com.fasterxml.jackson.annotation.JsonFormat(shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING)
    @Column(precision = 24, scale = 8) private BigDecimal rate;
    private String source;
    private String asOf;
    private Instant fetchedAt;
    @Transient private boolean stale;
    @Transient private boolean available;
}
