package com.example.moneydi.point;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor
public class Point {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String owner; // "남편네", "여편네"

    private Long balance = 0L;
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Point(String owner, Long balance) {
        this.owner = owner;
        this.balance = balance;
        this.updatedAt = LocalDateTime.now();
    }
}
