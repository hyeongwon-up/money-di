package com.example.moneydi.point;

import com.example.moneydi.common.InputChecks;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PointService {
    private final PointRepository pointRepository;
    private final PointHistoryRepository pointHistoryRepository;

    public List<Point> getAllPoints() {
        return pointRepository.findAll();
    }

    public Point getPointByOwner(String owner) {
        String validOwner = InputChecks.requiredText(owner, "소유자", 100);
        // Viewing a balance must not create a database record.
        return pointRepository.findByOwner(validOwner).orElseGet(() -> new Point(validOwner, 0L));
    }

    public List<PointHistory> getHistoryByOwner(String owner) {
        return pointHistoryRepository.findAllByOwnerOrderByCreatedAtDesc(InputChecks.requiredText(owner, "소유자", 100));
    }

    @Transactional
    public Point addPoints(String owner, Long amount, String description) {
        return changePoints(owner, amount, description, false);
    }

    @Transactional
    public Point usePoints(String owner, Long amount, String description) {
        return changePoints(owner, amount, description, true);
    }

    private Point changePoints(String owner, Long amount, String description, boolean spend) {
        String validOwner = InputChecks.requiredText(owner, "소유자", 100);
        long value = InputChecks.amount(amount, 1);
        String reason = InputChecks.requiredText(description, "내용", 255);
        // Serialize balance changes for an existing owner until balance AND history commit.
        Point point = pointRepository.findByOwnerForUpdate(validOwner)
                .orElseGet(() -> new Point(validOwner, 0L));
        long balance = point.getBalance();
        if (spend && balance < value) throw new IllegalArgumentException("포인트가 부족합니다. 사용 가능한 잔액을 확인해주세요.");
        if (!spend && balance > InputChecks.MAX_AMOUNT - value) throw new IllegalArgumentException("적립 후 잔액이 최대 허용 금액을 초과합니다.");
        point.setBalance(spend ? balance - value : balance + value);
        point.setUpdatedAt(LocalDateTime.now());
        // A concurrent first-ever insert fails the unique owner constraint and rolls back;
        // the API returns 409, so no change or history is silently lost.
        Point saved = pointRepository.save(point);
        pointHistoryRepository.save(new PointHistory(validOwner, spend ? -value : value, spend ? "USE" : "SAVE", reason));
        return saved;
    }
}
