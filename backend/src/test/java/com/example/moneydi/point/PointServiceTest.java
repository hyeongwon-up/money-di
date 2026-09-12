package com.example.moneydi.point;

import com.example.moneydi.common.InputChecks;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class PointServiceTest {
    @Mock PointRepository points;
    @Mock PointHistoryRepository histories;
    @InjectMocks PointService service;

    @ParameterizedTest
    @NullSource
    @ValueSource(longs = {0, -1, Long.MIN_VALUE, Long.MAX_VALUE})
    void rejectsInvalidAmountsWithoutChangingBalance(Long amount) {
        assertThatIllegalArgumentException().isThrownBy(() -> service.usePoints("남편네", amount, "사용"));
        assertThatIllegalArgumentException().isThrownBy(() -> service.addPoints("남편네", amount, "적립"));
        verifyNoInteractions(points, histories);
    }

    @Test void rejectsBlankReason() {
        assertThatIllegalArgumentException().isThrownBy(() -> service.addPoints("남편네", 1L, "  "));
        verifyNoInteractions(points, histories);
    }

    @Test void balanceReadDoesNotCreateAnOwner() {
        when(points.findByOwner("남편네")).thenReturn(Optional.empty());
        assertThat(service.getPointByOwner("남편네").getBalance()).isZero();
        verify(points, never()).save(any());
    }

    @Test void insufficientBalanceDoesNotWriteHistory() {
        Point point = new Point("남편네", 100L);
        when(points.findByOwnerForUpdate("남편네")).thenReturn(Optional.of(point));
        assertThatIllegalArgumentException().isThrownBy(() -> service.usePoints("남편네", 101L, "사용"));
        assertThat(point.getBalance()).isEqualTo(100L);
        verify(points, never()).save(any());
        verifyNoInteractions(histories);
    }

    @Test void balanceCannotExceedExactJsonIntegerRange() {
        when(points.findByOwnerForUpdate("남편네")).thenReturn(Optional.of(new Point("남편네", InputChecks.MAX_AMOUNT)));
        assertThatIllegalArgumentException().isThrownBy(() -> service.addPoints("남편네", 1L, "적립"));
        verifyNoInteractions(histories);
    }

    @Test void spendingEntireBalanceRecordsNegativeHistory() {
        when(points.findByOwnerForUpdate("남편네")).thenReturn(Optional.of(new Point("남편네", 100L)));
        when(points.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        assertThat(service.usePoints("남편네", 100L, " 사용 ").getBalance()).isZero();
        verify(histories).save(argThat(history -> history.getAmount() == -100L && history.getType().equals("USE") && history.getDescription().equals("사용")));
    }
}
