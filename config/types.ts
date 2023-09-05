export type Direction = "above" | "below";

export enum TradeState {
  ALERT_MODE,
  EXECUTE_TRADE,
  WAIT_FOR_COMPLETION,
  TRADE_COMPLETED,
  TRADE_WATCH,
  TRADE_EXIT,
  EXIT_COMPLETED,
}
