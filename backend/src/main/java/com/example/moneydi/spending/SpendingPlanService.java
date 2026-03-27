package com.example.moneydi.spending;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SpendingPlanService {

    private final SpendingPlanRepository spendingPlanRepository;

    @Transactional(readOnly = true)
    public List<SpendingPlan> getAllPlans() {
        return spendingPlanRepository.findAllByOrderByDueDateAsc();
    }

    public SpendingPlan createPlan(SpendingPlanRequestDto request) {
        SpendingPlan plan = new SpendingPlan();
        updatePlanFromDto(plan, request);
        return spendingPlanRepository.save(plan);
    }

    public SpendingPlan updatePlan(Long id, SpendingPlanRequestDto request) {
        SpendingPlan plan = spendingPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Spending plan not found"));
        updatePlanFromDto(plan, request);
        return spendingPlanRepository.save(plan);
    }

    public void deletePlan(Long id) {
        if (!spendingPlanRepository.existsById(id)) {
            throw new IllegalArgumentException("Spending plan not found");
        }
        spendingPlanRepository.deleteById(id);
    }

    private void updatePlanFromDto(SpendingPlan plan, SpendingPlanRequestDto request) {
        plan.setTitle(request.getTitle());
        plan.setAmount(request.getAmount());
        plan.setDueDate(request.getDueDate());
        plan.setDescription(request.getDescription());
        plan.setPaid(request.isPaid());
    }
}
