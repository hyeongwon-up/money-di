package com.example.moneydi.spending;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SpendingPlanServiceTest {

    @Mock
    private SpendingPlanRepository spendingPlanRepository;

    @InjectMocks
    private SpendingPlanService spendingPlanService;

    @Test
    @DisplayName("지출 계획 생성 시 요청 데이터가 엔티티로 올바르게 변환되어 저장되어야 한다")
    void createPlan_shouldSavePlanWithCorrectData() {
        // given
        SpendingPlanRequestDto request = new SpendingPlanRequestDto();
        request.setTitle("카드대금");
        request.setAmount(100000L);
        request.setDueDate(LocalDate.now());
        request.setPaid(false);

        when(spendingPlanRepository.save(any(SpendingPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        SpendingPlan savedPlan = spendingPlanService.createPlan(request);

        // then
        assertThat(savedPlan.getTitle()).isEqualTo("카드대금");
        assertThat(savedPlan.getAmount()).isEqualTo(100000L);
        assertThat(savedPlan.isPaid()).isFalse();
        verify(spendingPlanRepository).save(any(SpendingPlan.class));
    }

    @Test
    @DisplayName("지출 계획 수정 시 기존 데이터가 요청 데이터로 업데이트되어야 한다")
    void updatePlan_shouldUpdateExistingPlan() {
        // given
        Long planId = 1L;
        SpendingPlan existingPlan = new SpendingPlan();
        existingPlan.setId(planId);
        existingPlan.setTitle("기존 제목");

        SpendingPlanRequestDto request = new SpendingPlanRequestDto();
        request.setTitle("수정된 제목");
        request.setAmount(50000L);

        when(spendingPlanRepository.findById(planId)).thenReturn(Optional.of(existingPlan));
        when(spendingPlanRepository.save(any(SpendingPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        SpendingPlan updatedPlan = spendingPlanService.updatePlan(planId, request);

        // then
        assertThat(updatedPlan.getTitle()).isEqualTo("수정된 제목");
        assertThat(updatedPlan.getAmount()).isEqualTo(50000L);
    }
}
