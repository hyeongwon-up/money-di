package com.example.moneydi.asset;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor
public class Asset {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private Long amount;
    private Long previousAmount = 0L; // 이전 금액 추가
    private String category;    // SAVINGS, INSTALLMENT, STOCK, CRYPTO, REAL_ESTATE
    private String platform;    // 플랫폼(은행, 증권사 등)
    private String description; // 상세 메모
    private LocalDateTime createdAt = LocalDateTime.now();
}
