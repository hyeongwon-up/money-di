package com.example.moneydi.point;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;

@DataJpaTest(properties = {
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
@Import(PointService.class)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class PointTransactionTest {
    @Autowired PointRepository points;
    @SpyBean PointHistoryRepository histories;
    @Autowired PointService service;

    @Test void historyFailureRollsBackBalanceChange() {
        String owner = "rollback-test";
        points.saveAndFlush(new Point(owner, 100L));
        doThrow(new IllegalStateException("simulated history failure")).when(histories).save(any());
        assertThatThrownBy(() -> service.addPoints(owner, 50L, "적립")).isInstanceOf(IllegalStateException.class);
        assertThat(points.findByOwner(owner).orElseThrow().getBalance()).isEqualTo(100L);
        assertThat(histories.findAllByOwnerOrderByCreatedAtDesc(owner)).isEmpty();
    }
}
