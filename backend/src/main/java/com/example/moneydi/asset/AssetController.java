package com.example.moneydi.asset;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allow frontend to call the API
public class AssetController {
    private final AssetService assetService;

    @PostMapping
    public Asset register(@RequestBody Asset asset) {
        return assetService.saveAsset(asset);
    }

    @GetMapping
    public List<Asset> list() {
        return assetService.getAllAssets();
    }

    @GetMapping("/history")
    public List<AssetHistory> history() {
        return assetService.getAssetHistory();
    }

    @PutMapping("/history/{id}")
    public AssetHistory updateHistory(@PathVariable Long id, @RequestBody AssetHistory history) {
        return assetService.updateAssetHistory(id, history);
    }

    @DeleteMapping("/history/{id}")
    public void deleteHistory(@PathVariable Long id) {
        assetService.deleteAssetHistory(id);
    }

    @PutMapping("/{id}")
    public Asset update(@PathVariable Long id, @RequestBody Asset asset) {
        return assetService.updateAsset(id, asset);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        assetService.deleteAsset(id);
    }
}
