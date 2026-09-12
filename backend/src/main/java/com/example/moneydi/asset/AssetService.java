package com.example.moneydi.asset;

import lombok.RequiredArgsConstructor;
import com.example.moneydi.common.InputChecks;
import com.example.moneydi.common.ResourceNotFoundException;
import java.util.Set;
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
        validateAsset(asset);
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

    @Transactional(readOnly = true)
    public List<AssetHistory> getAssetHistory() {
        return assetHistoryRepository.findAll();
    }

    public AssetHistory updateAssetHistory(Long id, AssetHistory history) {
        InputChecks.amount(history.getTotalAmount(), -InputChecks.MAX_AMOUNT);
        AssetHistory existing = assetHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("자산 이력을 찾을 수 없습니다."));
        existing.setTotalAmount(history.getTotalAmount());
        if (history.getRecordedDate() != null) {
            existing.setRecordedDate(history.getRecordedDate());
        }
        return assetHistoryRepository.save(existing);
    }

    public void deleteAssetHistory(Long id) {
        if (!assetHistoryRepository.existsById(id)) throw new ResourceNotFoundException("자산 이력을 찾을 수 없습니다.");
        assetHistoryRepository.deleteById(id);
    }

    public Asset updateAsset(Long id, Asset assetDetails) {
        validateAsset(assetDetails);
        normalizeAmount(assetDetails);
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("자산을 찾을 수 없습니다. 목록을 새로고침해주세요."));
        
        // 금액이 변경된 경우 이전 금액으로 백업 (변동률 계산용)
        if (asset.getAmount() != null && !asset.getAmount().equals(assetDetails.getAmount())) {
            asset.setPreviousAmount(asset.getAmount());
        }

        asset.setName(assetDetails.getName());
        asset.setAmount(assetDetails.getAmount());
        asset.setCategory(assetDetails.getCategory());
        asset.setPlatform(assetDetails.getPlatform());
        asset.setDescription(assetDetails.getDescription());
        asset.setLiquid(assetDetails.isLiquid());
        
        normalizeAmount(asset);
        Asset updated = assetRepository.save(asset);
        
        refreshAllHistory();
        recordItemHistory(updated);
        return updated;
    }

    private void validateAsset(Asset asset) {
        asset.setName(InputChecks.requiredText(asset.getName(), "자산명", 100));
        InputChecks.amount(asset.getAmount(), -InputChecks.MAX_AMOUNT);
        if (asset.getCategory() == null || !Set.of("SAVINGS", "INSTALLMENT", "STOCK", "CRYPTO", "REAL_ESTATE", "DEBT", "LOAN", "OTHER").contains(asset.getCategory())) {
            throw new IllegalArgumentException("올바른 자산 카테고리를 선택해주세요.");
        }
        asset.setPlatform(InputChecks.optionalText(asset.getPlatform(), "플랫폼", 255));
        asset.setDescription(InputChecks.optionalText(asset.getDescription(), "메모", 255));
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
        if (!assetRepository.existsById(id)) throw new ResourceNotFoundException("자산을 찾을 수 없습니다.");
        assetRepository.deleteById(id);
        refreshAllHistory();
    }

    private void recordItemHistory(Asset asset) {
        AssetItemHistory itemHistory = AssetItemHistory.builder()
                .assetId(asset.getId())
                .amount(asset.getAmount())
                .recordedDate(java.time.LocalDate.now())
                .build();
        assetItemHistoryRepository.save(itemHistory);
    }
}
