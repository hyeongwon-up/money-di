package com.example.moneydi.asset;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetItemHistoryRepository extends JpaRepository<AssetItemHistory, Long> {
    List<AssetItemHistory> findByAssetIdOrderByRecordedDateDesc(Long assetId);
}
