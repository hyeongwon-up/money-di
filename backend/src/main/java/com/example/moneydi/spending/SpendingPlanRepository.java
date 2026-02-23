package com.example.moneydi.spending;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SpendingPlanRepository extends JpaRepository<SpendingPlan, Long> {
    List<SpendingPlan> findAllByOrderByDueDateAsc();
}
