import { GameID } from "boardGameAtlas.js";
import { randomInt } from "crypto";
import { GameCategory } from "csv.js";
import { writeFile } from "fs/promises";
import prompts from "prompts";
import { FullGame, RetrieveService } from "retrieve/retrieveService.js";

export const basePairingsFile = "./resources/basePairings.json";
export const winnerPairingsFile = "./resources/basePairings.json";
export const loserPairingsFile = "./resources/basePairings.json";

export interface Pairing {
  game1: {
    id: GameID;
    name: string;
  };
  game2: {
    id: GameID;
    name: string;
  };
}

interface ScoringGame {
  game: FullGame;
  seed: number;
  score: number;
  paired: boolean;
  opponent: GameID;
}

function denull(v: number | null): number {
  return v === null ? 0 : v;
}

export function printPairings(pairings: Pairing[]) {
  pairings.forEach((p) => {
    console.log(
      `${p.game1.name.padStart(52, "_")} vs ${p.game2.name.padEnd(52, "_")}`
    );
  });
}

const programs: prompts.Choice[] = [
  {
    title: "Base Pairings",
    value: basePairings,
    description: "Generate initial set of pairings",
  },
  {
    title: "Winner Bracket",
    value: winnerPairings,
    description:
      "Generate pairings for the winner bracket from the base winners",
  },
  {
    title: "Loser Bracket",
    value: loserPairings,
    description:
      "Generate pairings for the winner bracket from the base losers",
  },
];

export async function pairings() {
  const service = await RetrieveService.LoadJSON();
  if (!service) {
    return;
  }

  const selection = await prompts({
    type: "select",
    name: "round",
    message: "Select Round",
    choices: programs,
  });

  try {
    await selection.round(service);
  } catch (e) {
    console.error(e);
  }
}

async function basePairings(service: RetrieveService) {
  console.log("\nGenerating pairs for base round");
  const bracketGames = service.games.filter(
    (game) => game.Category === GameCategory.Bracket
  );

  const pairings = generatePairings(bracketGames);

  console.log(`\nSuccessfully generated ${pairings.length} pairings\n\n`);
  printPairings(pairings);

  console.log("\nWriting pairings to disk");
  await writeFile(basePairingsFile, JSON.stringify(pairings, null, "\t"));
}

async function loserPairings(service: RetrieveService) {}

async function winnerPairings(service: RetrieveService) {}

/**
 * Generate a series of pairings for a given array of games
 * @param games
 */
function generatePairings(games: FullGame[]): Pairing[] {
  if (games.length % 2 === 1) {
    throw new Error("List of games has an uneven count");
  }
  const pairings: Pairing[] = [];

  // initialize the list
  let pairingList = games.map((game) => {
    const s: ScoringGame = {
      game: game,
      seed: Math.random(),
      score: 10,
      paired: false,
      opponent: "",
    };
    return s;
  });

  // Randomize the initial list
  pairingList = pairingList.sort((a, b) => {
    return a.seed - b.seed;
  });

  // Generate a pairing for every game
  pairingList.forEach((game) => {
    if (game.paired) {
      return;
    }
    game.paired = true;

    const total = assignScores(pairingList, game);
    const r = randomInt(Math.floor(total)) + 1;
    const opponent = pairingList.find((p) => p.score >= r);

    if (!opponent) {
      throw new Error(`Unable to find pair for ${game.game.name}`);
    }

    opponent.paired = true;
    pairings.push({
      game1: { id: game.game.id, name: game.game.name },
      game2: { id: opponent.game.id, name: opponent.game.name },
    });
  });

  // Return the completed list of pairings
  return pairings;
}

function assignScores(list: ScoringGame[], targetGame: ScoringGame) {
  let totalScore = 0;
  list.forEach((scorer) => {
    if (scorer.paired) {
      scorer.score = 0;
    } else {
      const score = getScore(scorer.game, targetGame.game);
      totalScore += score;
      scorer.score = totalScore;
    }
  });
  return totalScore;
}

enum ScoringWeights {
  // Additive Weights
  sameMax = 20,
  nearMax = 10,
  sameMin = 5,
  nearPlaytimeMax = 5,
  nearPlaytimeMin = 5,
  sameSize = 15,

  // Multiplicative Weights
  sameMaxMin = 1.5,
  samePlaytimeMax = 1.2,
  samePlaytimeMin = 1.2,
  expansion = 3,
}

function getScore(g1: FullGame, g2: FullGame) {
  let score = 10;

  // Additives
  score +=
    denull(g1.max_players) === denull(g2.max_players)
      ? ScoringWeights.sameMax
      : 0;

  score +=
    Math.abs(denull(g1.max_players) - denull(g2.max_players)) <= 1
      ? ScoringWeights.nearMax
      : 0;

  score +=
    denull(g1.min_players) === denull(g2.min_players)
      ? ScoringWeights.sameMin
      : 0;

  score +=
    Math.abs(denull(g1.max_playtime) - denull(g2.max_playtime)) <= 30
      ? ScoringWeights.nearPlaytimeMax
      : 0;

  score +=
    Math.abs(denull(g1.min_playtime) - denull(g2.min_playtime)) <= 30
      ? ScoringWeights.nearPlaytimeMax
      : 0;

  score += g1.Size === g2.Size ? ScoringWeights.sameSize : 0;

  // Multipliers
  score *=
    denull(g1.max_players) === denull(g2.max_players) &&
    denull(g1.min_players) === denull(g2.min_players)
      ? ScoringWeights.sameMaxMin
      : 1;

  score *=
    denull(g1.max_playtime) === denull(g2.max_playtime)
      ? ScoringWeights.samePlaytimeMax
      : 1;

  score *=
    denull(g1.min_playtime) === denull(g2.min_playtime)
      ? ScoringWeights.samePlaytimeMin
      : 1;

  score *= g1.Expansion && g2.Expansion ? ScoringWeights.expansion : 1;

  return score;
}