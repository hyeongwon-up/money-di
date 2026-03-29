package com.example.moneydi.asset;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssetServiceTest {

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private AssetHistoryRepository assetHistoryRepository;

    @Mock
    private AssetItemHistoryRepository assetItemHistoryRepository;

    @InjectMocks
    private AssetService assetService;

    @Test
    @DisplayName("자산 저장 시 카테고리가 LOAN이면 금액이 음수로 변환되어야 한다")
    void saveAsset_shouldNormalizeLoanAmountToNegative() {
        // given
        Asset asset = new Asset();
        asset.setName("대출");
        asset.setAmount(1000L);
        asset.setCategory("LOAN");

        when(assetRepository.save(any(Asset.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(assetHistoryRepository.findByRecordedDate(any(LocalDate.class))).thenReturn(Optional.empty());

        // when
        Asset savedAsset = assetService.saveAsset(asset);

        // then
        assertThat(savedAsset.getAmount()).isEqualTo(-1000L);
        verify(assetRepository).save(asset);
    }

    @Test
    @DisplayName("자산 저장 시 카테고리가 SAVINGS면 금액이 양수여야 한다")
    void saveAsset_shouldNormalizeSavingsAmountToPositive() {
        // given
        Asset asset = new Asset();
        asset.setName("예금");
        asset.setAmount(-500L);
        asset.setCategory("SAVINGS");

        when(assetRepository.save(any(Asset.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(assetHistoryRepository.findByRecordedDate(any(LocalDate.class))).thenReturn(Optional.empty());

        // when
        Asset savedAsset = assetService.saveAsset(asset);

        // then
        assertThat(savedAsset.getAmount()).isEqualTo(500L);
    }

    @Test
    @DisplayName("자산 정보 수정 시 금액이 변경되면 previousAmount에 이전 금액이 저장되어야 한다")
    void updateAsset_shouldUpdatePreviousAmountWhenAmountChanges() {
        // given
        Long assetId = 1L;
        Asset existingAsset = new Asset();
        existingAsset.setId(assetId);
        existingAsset.setAmount(1000L);
        existingAsset.setCategory("SAVINGS");

        Asset assetDetails = new Asset();
        assetDetails.setAmount(1500L);
        assetDetails.setCategory("SAVINGS");
        assetDetails.setName("수정된 예금");

        when(assetRepository.findById(assetId)).thenReturn(Optional.of(existingAsset));
        when(assetRepository.save(any(Asset.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(assetHistoryRepository.findByRecordedDate(any(LocalDate.class))).thenReturn(Optional.empty());

        // when
        Asset updatedAsset = assetService.updateAsset(assetId, assetDetails);

        // then
        assertThat(updatedAsset.getAmount()).isEqualTo(1500L);
        assertThat(updatedAsset.getPreviousAmount()).isEqualTo(1000L);
    }

    @Test
    @DisplayName("자산 정보 수정 시 liquid 필드가 정상적으로 업데이트되어야 한다")
    void updateAsset_shouldUpdateLiquidField() {
        // given
        Long assetId = 1L;
        Asset existingAsset = new Asset();
        existingAsset.setId(assetId);
        existingAsset.setLiquid(true);

        Asset assetDetails = new Asset();
        assetDetails.setLiquid(false);
        assetDetails.setName("수정된 자산");
        assetDetails.setCategory("SAVINGS");
        assetDetails.setAmount(1000L);

        when(assetRepository.findById(assetId)).thenReturn(Optional.of(existingAsset));
        when(assetRepository.save(any(Asset.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        Asset updatedAsset = assetService.updateAsset(assetId, assetDetails);

        // then
        assertThat(updatedAsset.isLiquid()).isFalse();
    }

    @Test
    @DisplayName("모든 자산의 합계가 자산 이력에 정확히 기록되어야 한다")
    void refreshAllHistory_shouldCalculateTotalAmountCorrectly() {
        // given
        Asset asset1 = new Asset();
        asset1.setAmount(1000L);
        asset1.setCategory("SAVINGS");
        Asset asset2 = new Asset();
        asset2.setAmount(-300L);
        asset2.setCategory("LOAN");

        // syncAssetsAndHistory()와 refreshAllHistory()에서 각각 호출되므로 2번 응답 필요
        when(assetRepository.findAll()).thenReturn(List.of(asset1, asset2));
        when(assetHistoryRepository.findByRecordedDate(any(LocalDate.class))).thenReturn(Optional.empty());

        // when
        assetService.syncAssetsAndHistory();

        // then
        org.mockito.ArgumentCaptor<AssetHistory> captor = org.mockito.ArgumentCaptor.forClass(AssetHistory.class);
        verify(assetHistoryRepository).save(captor.capture());
        assertThat(captor.getValue().getTotalAmount()).isEqualTo(700L);
    }
}
