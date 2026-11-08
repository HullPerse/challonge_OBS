import type { Connector, HiddenIds } from "@/types/bracket";

/** Drops every connector that touches a hidden round or match. */
export const visibleConnectors = (
  connectors: readonly Connector[],
  hidden: HiddenIds,
): Connector[] => {
  return connectors.filter(
    (connector) =>
      !connector.fromRounds.some((round) => hidden.hiddenRounds.has(round)) &&
      !hidden.hiddenRounds.has(connector.toRound) &&
      !connector.fromIds.some((identifier) => hidden.hiddenMatches.has(identifier)) &&
      !hidden.hiddenMatches.has(connector.toId),
  );
};
