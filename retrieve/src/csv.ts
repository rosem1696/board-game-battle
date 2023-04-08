import { parseFile, writeToPath } from "fast-csv";
import path from "path";

const inputGamesFile = path.resolve("./resources/Board Games - Games.csv");
const outputGamesFile = "./resources/BoardGameDetails.csv";
const outputCategoriesFile = "./resources/BoardGameCategories.csv";
const outputMechanicsFile = "./resources/BoardGameMechanics.csv";

export enum GameCategory {
  Keep = "Keep",
  Bracket = "Bracket",
}

export enum GameSize {
  Tiny = "Tiny",
  Small = "Small",
  Medium = "Medium",
  Large = "Large",
  Huge = "Huge",
}

export interface BoardGameRow {
  Title: string;
  Category: GameCategory;
  Size: GameSize;
  "Not Game": boolean;
  Expansion: boolean;
  Stolen: boolean;
}

export interface BoardGameDetailRow extends BoardGameRow {
  "Atlas Name": string;
  "Year Published": string;
  "Min Players": string;
  "Max Players": string;
  "Min Playtime": string;
  "Max Playtime": string;
  "Min Age": string;
  Price: string;
  MSRP: string;
  "Primary Publisher": string;
  "Primary Designer": string;
  "Reddit All Time Count": string;
  "Reddit Week Count": string;
  "Reddit Day Count": string;
  "Add Date": string;
}

export async function readGames() {
  return new Promise<BoardGameRow[]>((resolve, reject) => {
    const games: BoardGameRow[] = [];
    parseFile(inputGamesFile, { headers: true })
      .on("error", (error) => reject(error))
      .on("data", (row) => {
        if (row.Title) {
          games.push({
            Title: row.Title as string,
            Category: row.Category as GameCategory,
            Size: row.Size as GameSize,
            "Not Game": row["Not Game"] === "TRUE",
            Expansion: row.Expansion === "TRUE",
            Stolen: row.Stolen === "TRUE",
          });
        }
      })
      .on("end", (rowCount: number) => {
        console.log(`Finished parsing ${rowCount} rows`);
        return resolve(games);
      });
  });
}

export async function writeGames<T extends BoardGameRow>(games: T[]) {
  return new Promise<void>((resolve, reject) => {
    writeToPath(outputGamesFile, games, { headers: true })
      .on("error", (error) => reject(error))
      .on("finish", () => resolve());
  });
}

export async function writeMechanics(gameMechanicRows: string[][]) {
  return new Promise<void>((resolve, reject) => {
    writeToPath(outputMechanicsFile, gameMechanicRows, { headers: true })
      .on("error", (error) => reject(error))
      .on("finish", () => resolve());
  });
}

export async function writeCategories(gameCategoryRows: string[][]) {
  return new Promise<void>((resolve, reject) => {
    writeToPath(outputCategoriesFile, gameCategoryRows, { headers: true })
      .on("error", (error) => reject(error))
      .on("finish", () => resolve());
  });
}
