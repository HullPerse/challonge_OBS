import { CARD_GAP, CARD_HEIGHT, CARD_WIDTH } from "@/configs/bracket.config";
import { indexByIdentifier } from "./graph.utils";
import type { BracketSection, Connector, PlacedMatch } from "@/types/bracket";

const cardCenter = (placed: PlacedMatch): number => {
  return placed.y + CARD_HEIGHT / 2;
};

const localPath = (from: PlacedMatch, to: PlacedMatch): string => {
  const startX = from.x + CARD_WIDTH;
  const startY = cardCenter(from);
  const endX = to.x;
  const endY = cardCenter(to);
  const trunkX = startX + CARD_GAP / 2;

  return startY === endY
    ? `M ${startX} ${startY} H ${endX}`
    : `M ${startX} ${startY} H ${trunkX} V ${endY} H ${endX}`;
};

const pairedPath = (feeders: readonly PlacedMatch[], to: PlacedMatch): string => {
  const sorted = [...feeders].sort((left, right) => left.y - right.y);
  const first = sorted.at(0);
  const second = sorted.at(1);
  if (!first || !second) return "";

  const firstX = first.x + CARD_WIDTH;
  const secondX = second.x + CARD_WIDTH;
  const firstY = cardCenter(first);
  const secondY = cardCenter(second);
  const endX = to.x;
  const trunkX = firstX + CARD_GAP / 2;
  const targetY = cardCenter(to);

  return [
    `M ${firstX} ${firstY} H ${trunkX} V ${targetY}`,
    `M ${secondX} ${secondY} H ${trunkX} V ${targetY} H ${endX}`,
  ].join(" ");
};

/** Feeders inside the same section that sit to the left of the target. */
const localFeeders = (
  placed: PlacedMatch,
  byIdentifier: Map<number, PlacedMatch>,
): PlacedMatch[] => {
  const seen = new Set<number>();
  const feeders: PlacedMatch[] = [];

  for (const identifier of [placed.match.prereq1, placed.match.prereq2]) {
    if (identifier === null) continue;

    const feeder = byIdentifier.get(identifier);
    if (!feeder) continue;
    if (feeder.x + CARD_WIDTH > placed.x) continue;
    if (seen.has(feeder.match.id)) continue;

    seen.add(feeder.match.id);
    feeders.push(feeder);
  }

  return feeders;
};

const connectorFor = (placed: PlacedMatch, feeders: readonly PlacedMatch[]): Connector | null => {
  const first = feeders.at(0);
  if (!first) return null;

  return {
    id: `to-${placed.match.id}`,
    d: feeders.length >= 2 ? pairedPath(feeders, placed) : localPath(first, placed),
    fromIds: feeders.map((feeder) => feeder.match.id),
    fromRounds: feeders.map((feeder) => feeder.match.round),
    toId: placed.match.id,
    toRound: placed.match.round,
  };
};

const sectionConnectors = (section: BracketSection): Connector[] => {
  const byIdentifier = indexByIdentifier(section.matches);
  const connectors: Connector[] = [];

  for (const placed of section.matches) {
    const connector = connectorFor(placed, localFeeders(placed, byIdentifier));
    if (connector) connectors.push(connector);
  }

  return connectors;
};

/** Grand final gets one link from the winners final; its losers feeder crosses sections. */
const winnersToFinals = (winners: BracketSection, finals: BracketSection): Connector | null => {
  const main =
    finals.matches.find((placed) => placed.match.side === "finals") ?? finals.matches.at(0);
  if (!main) return null;

  const byIdentifier = indexByIdentifier(winners.matches);
  const feeder = [main.match.prereq1, main.match.prereq2]
    .map((identifier) => (identifier === null ? undefined : byIdentifier.get(identifier)))
    .find((placed): placed is PlacedMatch => placed !== undefined);

  if (!feeder) return null;

  return {
    id: `to-${main.match.id}`,
    d: localPath(feeder, main),
    fromIds: [feeder.match.id],
    fromRounds: [feeder.match.round],
    toId: main.match.id,
    toRound: main.match.round,
  };
};

export const buildConnectors = (sections: readonly BracketSection[]): Connector[] => {
  const connectors = sections.flatMap(sectionConnectors);
  const winners = sections.find((section) => section.side === "winners");
  const finals = sections.find((section) => section.side === "finals");
  if (!winners || !finals) return connectors;

  const crossSection = winnersToFinals(winners, finals);

  const connectorsNotEqual =
    crossSection && !connectors.some((connector) => connector.toId === crossSection.toId);

  if (connectorsNotEqual) connectors.push(crossSection);

  return connectors;
};
