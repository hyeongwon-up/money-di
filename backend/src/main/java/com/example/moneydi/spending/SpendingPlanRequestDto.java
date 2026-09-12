package com.example.moneydi.spending;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonAlias;
import java.time.LocalDate;

@Data
public class SpendingPlanRequestDto {
    private String title;
    private Long amount;
    private LocalDate dueDate;
    private String description;
    @JsonAlias("isPaid")
    private boolean paid;
}
