package com.example.moneydi.asset;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface AssetHistoryRepository extends JpaRepository<AssetHistory, Long> {
    Optional<AssetHistory> findByRecordedDate(LocalDate date);
}
