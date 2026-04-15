export const buildRollbackPlan = (currentVersion: string, previousStableVersion: string) => ({
  strategy: "blue-green-rollback",
  steps: [
    `Switch traffic from ${currentVersion} to ${previousStableVersion}`,
    `Invalidate canary pods running ${currentVersion}`,
    `Run post-rollback health checks`
  ]
});
