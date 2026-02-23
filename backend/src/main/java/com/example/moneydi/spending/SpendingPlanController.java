package com.example.moneydi.spending;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/spending-plans")
@CrossOrigin(origins = "*")
public class SpendingPlanController {

    private final SpendingPlanRepository spendingPlanRepository;

    public SpendingPlanController(SpendingPlanRepository spendingPlanRepository) {
        this.spendingPlanRepository = spendingPlanRepository;
    }

    @GetMapping
    public List<SpendingPlan> getAll() {
        return spendingPlanRepository.findAllByOrderByDueDateAsc();
    }

    @PostMapping
    public SpendingPlan create(@RequestBody SpendingPlanRequestDto request) {
        SpendingPlan plan = new SpendingPlan();
        plan.setTitle(request.getTitle());
        plan.setAmount(request.getAmount());
        plan.setDueDate(request.getDueDate());
        plan.setDescription(request.getDescription());
        plan.setPaid(request.isPaid());
        return spendingPlanRepository.save(plan);
    }

    @PutMapping("/{id}")
    public SpendingPlan update(@PathVariable Long id, @RequestBody SpendingPlanRequestDto request) {
        SpendingPlan plan = spendingPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Spending plan not found"));
        plan.setTitle(request.getTitle());
        plan.setAmount(request.getAmount());
        plan.setDueDate(request.getDueDate());
        plan.setDescription(request.getDescription());
        plan.setPaid(request.isPaid());
        return spendingPlanRepository.save(plan);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!spendingPlanRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        spendingPlanRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
