import { GameID } from "boardGameAtlas.js";
import { readFileJSON, writeFileJSON } from "fileHelp.js";
import { readFile, writeFile } from "fs/promises";
import { GameIDName, loadBasePairings, Pairing } from "pairings/pairings.js";
import prompts from "prompts";

// Change this after everyone arrives
const numVoters = 8;

export const openingResultsFile = "./resources/openingResults.json";
export const winnerResultsFile = "./resources/winnerResults.json";
export const loserResultsFile = "./resources/loserResults.json";

export interface GameResult extends GameIDName {
  votes?: number;
  votedByWill?: boolean;
}

export interface VoteResult {
  game1: GameResult;
  game2: GameResult;
}

export interface OpeningResults {
  results: VoteResult[];
}

export interface BracketResults {
  round1?: VoteResult[];
  round2?: VoteResult[];
  round3?: VoteResult[];
  quarterFinal?: VoteResult[];
  semiFinal?: VoteResult[];
  final?: VoteResult[];
}

export interface OpeningResults {
  results: VoteResult[];
}

const programs: prompts.Choice[] = [
  {
    title: "Opening Round",
    value: enterOpeningResults,
    description: "Enter results of the initial pairings",
  },
  {
    title: "Winner Bracket",
    value: enterWinnerResults,
    description: "Enter results for the next round of the winner bracket",
  },
  {
    title: "Loser Bracket",
    value: enterLoserResults,
    description: "Enter results for the next round of the winner bracket",
  },
];

export async function tournament() {
  const selection = await prompts({
    type: "select",
    name: "round",
    message: "Select Tournament Round",
    choices: programs,
  });

  try {
    await selection.round();
  } catch (e) {
    console.error(e);
  }
}

async function enterOpeningResults() {
  const res = await loadBasePairings();
  if (res === undefined) {
    throw new Error("Opening results file does not exist");
  }
  const pairings: OpeningResults = { results: res };
  for (const pair of pairings.results) {
    await GetPairingResult(pair);
    printResult(pair);
  }
  writeFileJSON(openingResultsFile, pairings);
}

async function enterWinnerResults() {}

async function enterLoserResults() {}

/**
 * TODO handle loser round case
 * @param result
 */
function printResult(result: VoteResult, inLoserRound?: boolean) {
  const winner = getWinner(result);
  const loser = winner.id === result.game1.id ? result.game2 : result.game1;
  console.log(`\n\n${winner.name} beats ${loser.name}`);
  console.log(`${winner.votes} to ${loser.votes}`);
  if (winner.votes === loser.votes) {
    console.log("Tie broken by Will");
  }
  console.log(`${winner.name} advances\n\n`);
}

export function getLoser(result: VoteResult) {
  return getWinner(result).id === result.game1.id ? result.game2 : result.game1;
}

export function getWinner(result: VoteResult) {
  if (
    result.game1.votes === undefined ||
    result.game1.votedByWill === undefined ||
    result.game2.votes === undefined ||
    result.game2.votedByWill === undefined
  ) {
    throw new Error(
      "Vote result had undefined in it, something has gone wrong"
    );
  }

  if (result.game1.votes === result.game2.votes) {
    return result.game1.votedByWill ? result.game1 : result.game2;
  } else {
    return result.game1.votes > result.game2.votes
      ? result.game1
      : result.game2;
  }
}

async function GetPairingResult(result: VoteResult) {
  const gameChoice: prompts.Choice[] = [
    {
      title: result.game1.name,
      value: result.game1,
    },
    {
      title: result.game2.name,
      value: result.game2,
    },
  ];

  const vote1 = await prompts({
    type: "number",
    name: "count",
    message: `Enter Number of Votes for ${result.game1.name}`,
    initial: 0,
    min: 0,
    max: numVoters,
  });

  const will = await prompts({
    type: "select",
    name: "data",
    message: "Select Game Will Voted For",
    choices: gameChoice,
  });

  result.game1.votes = vote1.count;
  result.game2.votes = numVoters - vote1.count;

  const notWill = will.data.id == result.game1.id ? result.game2 : result.game1;
  will.data.votedByWill = true;
  notWill.votedByWill = false;
}

export async function loadOpeningResults() {
  return readFileJSON<OpeningResults>(openingResultsFile);
}

export async function loadWinnerResults() {
  const res = await readFileJSON<BracketResults>(winnerResultsFile);
  return res === undefined ? {} : res;
}

export async function loadLoserResults() {
  const res = await readFileJSON<BracketResults>(loserResultsFile);
  return res === undefined ? {} : res;
}
