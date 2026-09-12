package com.example.moneydi.asset;

import lombok.Data;

/** Only user-editable properties are accepted; identifiers and history stay server-owned. */
@Data
public class AssetRequestDto {
    private String name;
    private Long amount;
    private String category;
    private String platform;
    private String description;
    private boolean liquid = true;

    public Asset toAsset() {
        Asset asset = new Asset();
        asset.setName(name);
        asset.setAmount(amount);
        asset.setCategory(category);
        asset.setPlatform(platform);
        asset.setDescription(description);
        asset.setLiquid(liquid);
        return asset;
    }
}
