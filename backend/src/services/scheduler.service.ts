import * as cron from "node-cron";
import { AlertService } from "./alert.service";

export class SchedulerService {
  private static thresholdCheckTask?: cron.ScheduledTask;
  private static expiryCheckTask?: cron.ScheduledTask;

  static start(): void {
    this.thresholdCheckTask = cron.schedule("0 * * * *", async () => {
      console.log("Running hourly threshold check...");
      try {
        await AlertService.checkAllThresholds();
        console.log("Threshold check completed");
      } catch (error) {
        console.error("Threshold check failed:", error);
      }
    });

    this.expiryCheckTask = cron.schedule("0 8 * * *", async () => {
      console.log("Running daily expiry check...");
      try {
        await AlertService.checkExpiringItems();
        console.log("Expiry check completed");
      } catch (error) {
        console.error("Expiry check failed:", error);
      }
    });

    console.log("✅ Alert scheduler started");
    console.log("  - Threshold checks: hourly");
    console.log("  - Expiry checks: daily at 8:00 AM");
  }

  static stop(): void {
    if (this.thresholdCheckTask) {
      this.thresholdCheckTask.stop();
    }
    if (this.expiryCheckTask) {
      this.expiryCheckTask.stop();
    }
    console.log("Alert scheduler stopped");
  }
}
