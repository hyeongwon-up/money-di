package com.example.moneydi.asset;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AssetService {
    private final AssetRepository assetRepository;
    private final AssetHistoryRepository assetHistoryRepository;
    private final AssetItemHistoryRepository assetItemHistoryRepository;

    public Asset saveAsset(Asset asset) {
        if (asset.getAmount() == null) asset.setAmount(0L);
        Asset saved = assetRepository.save(asset);
        updateHistory();
        recordItemHistory(saved);
        return saved;
    }

    public List<Asset> getAllAssets() {
        return assetRepository.findAll();
    }

    public List<AssetHistory> getAssetHistory() {
        return assetHistoryRepository.findAll();
    }

    public AssetHistory updateAssetHistory(Long id, AssetHistory history) {
        AssetHistory existing = assetHistoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("History not found with id " + id));
        existing.setTotalAmount(history.getTotalAmount());
        if (history.getRecordedDate() != null) {
            existing.setRecordedDate(history.getRecordedDate());
        }
        return assetHistoryRepository.save(existing);
    }

    public void deleteAssetHistory(Long id) {
        assetHistoryRepository.deleteById(id);
    }

    public Asset updateAsset(Long id, Asset assetDetails) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found with id " + id));
        
        // 금액이 변경된 경우 이전 금액으로 백업 (변동률 계산용)
        if (!asset.getAmount().equals(assetDetails.getAmount())) {
            asset.setPreviousAmount(asset.getAmount());
        }

        asset.setName(assetDetails.getName());
        asset.setAmount(assetDetails.getAmount());
        asset.setCategory(assetDetails.getCategory());
        asset.setPlatform(assetDetails.getPlatform()); // 플랫폼 업데이트 추가
        asset.setDescription(assetDetails.getDescription());
        Asset updated = assetRepository.save(asset);
        
        updateHistory();
        recordItemHistory(updated);
        return updated;
    }

    public void deleteAsset(Long id) {
        assetRepository.deleteById(id);
        updateHistory();
    }

    private void recordItemHistory(Asset asset) {
        AssetItemHistory itemHistory = AssetItemHistory.builder()
                .assetId(asset.getId())
                .amount(asset.getAmount())
                .recordedDate(java.time.LocalDate.now())
                .build();
        assetItemHistoryRepository.save(itemHistory);
    }

    private void updateHistory() {
        List<Asset> allAssets = assetRepository.findAll();
        long totalAmount = allAssets.stream()
                .mapToLong(a -> {
                    long amt = a.getAmount() != null ? a.getAmount() : 0L;
                    // 대출(LOAN) 카테고리인 경우 차감(-) 처리
                    return "LOAN".equals(a.getCategory()) ? -amt : amt;
                })
                .sum();

        java.time.LocalDate today = java.time.LocalDate.now();
        AssetHistory history = assetHistoryRepository.findByRecordedDate(today)
                .orElseGet(() -> AssetHistory.builder().recordedDate(today).build());

        history.setTotalAmount(totalAmount);
        assetHistoryRepository.save(history);
    }
}
