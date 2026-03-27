package com.example.moneydi.spending;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/spending-plans")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SpendingPlanController {

    private final SpendingPlanService spendingPlanService;

    @GetMapping
    public List<SpendingPlan> getAll() {
        return spendingPlanService.getAllPlans();
    }

    @PostMapping
    public SpendingPlan create(@RequestBody SpendingPlanRequestDto request) {
        return spendingPlanService.createPlan(request);
    }

    @PutMapping("/{id}")
    public SpendingPlan update(@PathVariable Long id, @RequestBody SpendingPlanRequestDto request) {
        return spendingPlanService.updatePlan(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            spendingPlanService.deletePlan(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
