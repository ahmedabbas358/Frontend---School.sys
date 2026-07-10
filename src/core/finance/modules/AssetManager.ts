export interface FixedAsset {
  id: string;
  name: string; // e.g. "School Bus 01"
  purchaseDate: Date;
  purchaseCost: number;
  salvageValue: number;
  usefulLifeYears: number;
  accumulatedDepreciation: number;
  isActive: boolean;
}

export class AssetManager {
  private assets: Map<string, FixedAsset> = new Map();

  public registerAsset(asset: FixedAsset) {
    this.assets.set(asset.id, { ...asset, accumulatedDepreciation: 0, isActive: true });
  }

  /**
   * Calculates Straight-Line Depreciation for a given year.
   * Formula: (Purchase Cost - Salvage Value) / Useful Life
   */
  public calculateAnnualDepreciation(assetId: string): number {
    const asset = this.assets.get(assetId);
    if (!asset || !asset.isActive) return 0;

    const annualDepreciation = (asset.purchaseCost - asset.salvageValue) / asset.usefulLifeYears;
    return Math.round(annualDepreciation * 100) / 100;
  }

  /**
   * Runs the depreciation cycle, updating accumulated depreciation.
   * In a real system, this would also generate a Journal Entry (Debit Depreciation Expense, Credit Accumulated Depreciation).
   */
  public runDepreciationCycle(assetId: string) {
    const asset = this.assets.get(assetId);
    if (!asset || !asset.isActive) return;

    const amount = this.calculateAnnualDepreciation(assetId);
    
    if (asset.accumulatedDepreciation + amount > (asset.purchaseCost - asset.salvageValue)) {
      // Asset is fully depreciated
      asset.accumulatedDepreciation = asset.purchaseCost - asset.salvageValue;
      asset.isActive = false; // Retire from depreciation cycle
    } else {
      asset.accumulatedDepreciation += amount;
    }
    
    this.assets.set(assetId, asset);
  }

  public getNetBookValue(assetId: string): number {
    const asset = this.assets.get(assetId);
    if (!asset) return 0;
    return asset.purchaseCost - asset.accumulatedDepreciation;
  }
}
