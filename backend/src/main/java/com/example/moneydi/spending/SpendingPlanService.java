package com.example.moneydi.spending;

import lombok.RequiredArgsConstructor;
import com.example.moneydi.common.InputChecks;
import com.example.moneydi.common.ResourceNotFoundException;
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
                .orElseThrow(() -> new ResourceNotFoundException("지출 계획을 찾을 수 없습니다. 목록을 새로고침해주세요."));
        updatePlanFromDto(plan, request);
        return spendingPlanRepository.save(plan);
    }

    public void deletePlan(Long id) {
        if (!spendingPlanRepository.existsById(id)) {
            throw new ResourceNotFoundException("지출 계획을 찾을 수 없습니다. 목록을 새로고침해주세요.");
        }
        spendingPlanRepository.deleteById(id);
    }

    private void updatePlanFromDto(SpendingPlan plan, SpendingPlanRequestDto request) {
        plan.setTitle(InputChecks.requiredText(request.getTitle(), "지출 항목명", 100));
        plan.setAmount(InputChecks.amount(request.getAmount(), 0));
        if (request.getDueDate() == null) throw new IllegalArgumentException("지출 예정일을 입력해주세요.");
        plan.setDueDate(request.getDueDate());
        plan.setDescription(InputChecks.optionalText(request.getDescription(), "메모", 255));
        plan.setPaid(request.isPaid());
    }
}
