import { DepositClient } from "./deposit-client";

export default function DepositPage() {
  const simulateEnabled =
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_DEPOSIT_SIMULATE === "true";

  return <DepositClient simulateEnabled={simulateEnabled} />;
}
