package com.example.moneydi.point;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface PointRepository extends JpaRepository<Point, Long> {
    Optional<Point> findByOwner(String owner);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Point p where p.owner = :owner")
    Optional<Point> findByOwnerForUpdate(@Param("owner") String owner);
}
