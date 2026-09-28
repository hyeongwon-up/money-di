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
    private final com.example.moneydi.exchange.ExchangeRateService exchangeRates;
    private final AssetRepository assetRepository;
    private final AssetHistoryRepository assetHistoryRepository;
    private final AssetItemHistoryRepository assetItemHistoryRepository;

    public Asset saveAsset(Asset asset) {
        validateAsset(asset);
        normalizeAmount(asset);
        Asset saved = assetRepository.save(asset);
        refreshAllHistory(); // 전체 이력 재계산으로 정확도 보장
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
        List<Asset> allAssets = assetRepository.findAll().stream().map(this::valuedCopy).toList();
        long totalAmount = allAssets.stream()
                .mapToLong(a -> a.getAmount() != null ? a.getAmount() : 0L)
                .sum();

        java.time.LocalDate today = java.time.LocalDate.now();
        AssetHistory history = assetHistoryRepository.findByRecordedDate(today)
                .orElseGet(() -> AssetHistory.builder().recordedDate(today).build());

        history.setTotalAmount(totalAmount);
        assetHistoryRepository.save(history);
        // Capture every current asset at the same valuation used for the total.
        allAssets.forEach(asset -> recordItemHistory(asset, today));
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    public List<Asset> getAllAssets() {
        return assetRepository.findAll().stream().map(this::valuedCopy).toList();
    }

    @Transactional(readOnly = true)
    public List<AssetHistory> getAssetHistory() {
        return assetHistoryRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<AssetItemHistory> getAssetItemHistory() {
        return assetItemHistoryRepository.findAll();
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

        asset.setCurrency(assetDetails.getCurrency());
        asset.setForeignAmount(assetDetails.getForeignAmount());
        asset.setName(assetDetails.getName());
        asset.setAmount(assetDetails.getAmount());
        asset.setCategory(assetDetails.getCategory());
        asset.setPlatform(assetDetails.getPlatform());
        asset.setDescription(assetDetails.getDescription());
        asset.setLiquid(assetDetails.isLiquid());
        
        normalizeAmount(asset);
        Asset updated = assetRepository.save(asset);
        
        refreshAllHistory();
        return updated;
    }

    private void validateAsset(Asset asset) {
        asset.setName(InputChecks.requiredText(asset.getName(), "자산명", 100));
        String currency = asset.getCurrency() == null ? "KRW" : asset.getCurrency();
        if (!Set.of("KRW", "USD", "USDT").contains(currency)) throw new IllegalArgumentException("지원하지 않는 통화입니다.");
        asset.setCurrency(currency);
        if ("KRW".equals(currency)) {
            asset.setForeignAmount(null);
        } else {
            var quantity = asset.getForeignAmount();
            if (quantity == null || quantity.signum() < 0 || quantity.stripTrailingZeros().scale() > 8 || quantity.compareTo(java.math.BigDecimal.valueOf(1000000000000L)) > 0)
                throw new IllegalArgumentException("외화 수량은 0 이상 1조 이하, 소수점 8자리까지 입력해주세요.");
            revalue(asset, true);
        }
        InputChecks.amount(asset.getAmount(), -InputChecks.MAX_AMOUNT);
        if (asset.getCategory() == null || !Set.of("SAVINGS", "INSTALLMENT", "STOCK", "CRYPTO", "REAL_ESTATE", "DEBT", "LOAN", "OTHER").contains(asset.getCategory())) {
            throw new IllegalArgumentException("올바른 자산 카테고리를 선택해주세요.");
        }
        asset.setPlatform(InputChecks.optionalText(asset.getPlatform(), "플랫폼", 255));
        asset.setDescription(InputChecks.optionalText(asset.getDescription(), "메모", 255));
    }

    private Asset valuedCopy(Asset source) {
        Asset copy = new Asset();
        org.springframework.beans.BeanUtils.copyProperties(source, copy);
        revalue(copy, false);
        normalizeAmount(copy);
        return copy;
    }

    private void revalue(Asset asset, boolean required) {
        if (asset.getCurrency() == null || "KRW".equals(asset.getCurrency())) return;
        var quote = exchangeRates.get(asset.getCurrency());
        asset.setExchangeRate(quote);
        if (!quote.isAvailable()) {
            if (required) throw new IllegalArgumentException("환율을 아직 불러오지 못했습니다. 잠시 후 다시 저장해주세요.");
            return; // Keep the last saved KRW value, never substitute zero.
        }
        var converted = asset.getForeignAmount().multiply(quote.getRate()).setScale(0, java.math.RoundingMode.HALF_UP);
        if (converted.abs().compareTo(java.math.BigDecimal.valueOf(InputChecks.MAX_AMOUNT)) > 0)
            throw new IllegalArgumentException("원화 환산액이 지원 범위를 초과합니다.");
        asset.setAmount(converted.longValueExact());
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

    private void recordItemHistory(Asset asset, java.time.LocalDate recordedDate) {
        AssetItemHistory itemHistory = AssetItemHistory.builder()
                .assetId(asset.getId())
                .amount(asset.getAmount())
                .recordedDate(recordedDate)
                .build();
        assetItemHistoryRepository.save(itemHistory);
    }
}
