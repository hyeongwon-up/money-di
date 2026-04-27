package com.example.moneydi.point;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PointService {
    private final PointRepository pointRepository;
    private final PointHistoryRepository pointHistoryRepository;

    public List<Point> getAllPoints() {
        return pointRepository.findAll();
    }

    public Point getPointByOwner(String owner) {
        return pointRepository.findByOwner(owner)
                .orElseGet(() -> pointRepository.save(new Point(owner, 0L)));
    }

    public List<PointHistory> getHistoryByOwner(String owner) {
        return pointHistoryRepository.findAllByOwnerOrderByCreatedAtDesc(owner);
    }

    @Transactional
    public Point addPoints(String owner, Long amount, String description) {
        Point point = getPointByOwner(owner);
        point.setBalance(point.getBalance() + amount);
        point.setUpdatedAt(LocalDateTime.now());
        
        pointHistoryRepository.save(new PointHistory(owner, amount, "SAVE", description));
        return pointRepository.save(point);
    }

    @Transactional
    public Point usePoints(String owner, Long amount, String description) {
        Point point = getPointByOwner(owner);
        if (point.getBalance() < amount) {
            throw new IllegalArgumentException("포인트가 부족합니다.");
        }
        point.setBalance(point.getBalance() - amount);
        point.setUpdatedAt(LocalDateTime.now());
        
        pointHistoryRepository.save(new PointHistory(owner, -amount, "USE", description));
        return pointRepository.save(point);
    }
}
