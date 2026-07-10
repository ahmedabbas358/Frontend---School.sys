import { RevenueRecognition } from './RevenueRecognition';
import { AssetManager } from './AssetManager';

export class FinancialScheduler {
  private revenueEngine: RevenueRecognition;
  private assetManager: AssetManager;

  constructor(revenueEngine: RevenueRecognition, assetManager: AssetManager) {
    this.revenueEngine = revenueEngine;
    this.assetManager = assetManager;
  }

  /**
   * Orchestrates end-of-month automated tasks.
   * In a real environment, this would be triggered by a Cron Job.
   */
  public executeMonthlyClosing(activeAssetIds: string[]) {
    console.log("Starting Monthly Closing Process...");
    
    // 1. Recognize deferred revenue
    const revenueEntries = this.revenueEngine.runMonthlyRecognition();
    console.log(`Recognized ${revenueEntries.length} revenue schedules.`);

    // 2. Run Depreciation for all active assets
    // Since depreciation is annual in our simple model, we can divide by 12 or run it yearly.
    // For this example, we assume we want to track it somehow, but we'll leave it as a placeholder.
    activeAssetIds.forEach(id => {
      this.assetManager.runDepreciationCycle(id);
    });
    console.log(`Ran depreciation for ${activeAssetIds.length} assets.`);

    // 3. (Future) Accrue Late Fees
    // 4. (Future) Recurring Journals

    console.log("Monthly Closing Process Complete.");
  }
}
