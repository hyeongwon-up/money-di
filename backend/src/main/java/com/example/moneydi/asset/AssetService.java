package com.example.moneydi.asset;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AssetService {
    private final AssetRepository assetRepository;
    private final AssetHistoryRepository assetHistoryRepository;
    private final AssetItemHistoryRepository assetItemHistoryRepository;

    public Asset saveAsset(Asset asset) {
        if (asset.getAmount() == null) asset.setAmount(0L);
        normalizeAmount(asset);
        Asset saved = assetRepository.save(asset);
        refreshAllHistory(); // 전체 이력 재계산으로 정확도 보장
        recordItemHistory(saved);
        return saved;
    }

    // 모든 자산의 부호를 맞추고 이력을 재계산하는 로직
    public void syncAssetsAndHistory() {
        List<Asset> all = assetRepository.findAll();
        all.forEach(this::normalizeAmount);
        assetRepository.saveAll(all);
        refreshAllHistory();
    }

    private void refreshAllHistory() {
        List<Asset> allAssets = assetRepository.findAll();
        long totalAmount = allAssets.stream()
                .mapToLong(a -> a.getAmount() != null ? a.getAmount() : 0L)
                .sum();

        java.time.LocalDate today = java.time.LocalDate.now();
        AssetHistory history = assetHistoryRepository.findByRecordedDate(today)
                .orElseGet(() -> AssetHistory.builder().recordedDate(today).build());

        history.setTotalAmount(totalAmount);
        assetHistoryRepository.save(history);
    }

    @Transactional(readOnly = true)
    public List<Asset> getAllAssets() {
        return assetRepository.findAll();
    }
    
    // ... (중략)

    public Asset updateAsset(Long id, Asset assetDetails) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found with id " + id));
        
        if (asset.getAmount() != null && !asset.getAmount().equals(assetDetails.getAmount())) {
            asset.setPreviousAmount(asset.getAmount());
        }

        asset.setName(assetDetails.getName());
        asset.setAmount(assetDetails.getAmount());
        asset.setCategory(assetDetails.getCategory());
        asset.setPlatform(assetDetails.getPlatform());
        asset.setDescription(assetDetails.getDescription());
        
        normalizeAmount(asset);
        Asset updated = assetRepository.save(asset);
        
        refreshAllHistory();
        recordItemHistory(updated);
        return updated;
    }

    private void normalizeAmount(Asset asset) {
        if (asset.getAmount() == null) return;
        String cat = asset.getCategory();
        if ("LOAN".equals(cat) || "DEBT".equals(cat)) {
            asset.setAmount(-Math.abs(asset.getAmount()));
        } else {
            asset.setAmount(Math.abs(asset.getAmount()));
        }
    }

    public void deleteAsset(Long id) {
        assetRepository.deleteById(id);
        refreshAllHistory();
    }

}
