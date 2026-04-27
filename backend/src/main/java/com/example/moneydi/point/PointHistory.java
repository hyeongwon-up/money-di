package com.example.moneydi.point;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor
public class PointHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String owner;
    private Long amount; // 변동 금액 (+ 또는 -)
    private String type; // "SAVE", "USE"
    private String description;
    private LocalDateTime createdAt = LocalDateTime.now();

    public PointHistory(String owner, Long amount, String type, String description) {
        this.owner = owner;
        this.amount = amount;
        this.type = type;
        this.description = description;
        this.createdAt = LocalDateTime.now();
    }
}
