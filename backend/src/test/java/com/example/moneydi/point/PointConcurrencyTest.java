package com.example.moneydi.point;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
@Import(PointService.class)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class PointConcurrencyTest {
    @Autowired PointRepository points;
    @Autowired PointHistoryRepository histories;
    @Autowired PointService service;

    @Test void concurrentSpendingCannotOverdrawOrLoseHistory() throws Exception {
        String owner = "concurrent-spending";
        points.saveAndFlush(new Point(owner, 100L));
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        Callable<Boolean> spend = () -> {
            start.await();
            try { service.usePoints(owner, 80L, "사용"); return true; }
            catch (IllegalArgumentException exception) { return false; }
        };
        try {
            Future<Boolean> first = executor.submit(spend);
            Future<Boolean> second = executor.submit(spend);
            start.countDown();
            assertThat((first.get(10, TimeUnit.SECONDS) ? 1 : 0) + (second.get(10, TimeUnit.SECONDS) ? 1 : 0)).isEqualTo(1);
            assertThat(points.findByOwner(owner).orElseThrow().getBalance()).isEqualTo(20L);
            assertThat(histories.findAllByOwnerOrderByCreatedAtDesc(owner)).hasSize(1);
        } finally { executor.shutdownNow(); }
    }

    @Test void concurrentCreditsBothReachBalanceAndHistory() throws Exception {
        String owner = "concurrent-credit";
        points.saveAndFlush(new Point(owner, 0L));
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        Callable<Point> credit = () -> { start.await(); return service.addPoints(owner, 100L, "적립"); };
        try {
            Future<Point> first = executor.submit(credit);
            Future<Point> second = executor.submit(credit);
            start.countDown();
            first.get(10, TimeUnit.SECONDS);
            second.get(10, TimeUnit.SECONDS);
            assertThat(points.findByOwner(owner).orElseThrow().getBalance()).isEqualTo(200L);
            assertThat(histories.findAllByOwnerOrderByCreatedAtDesc(owner)).hasSize(2);
        } finally { executor.shutdownNow(); }
    }
}
