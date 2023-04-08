import get, { SearchParameters as BaseParameters } from "got";

export type GameID = string;

export interface AtlasGame {
  id: GameID;
  name: string;
  names: string[];
  year_published: number | null;
  min_players: number | null;
  max_players: number | null;
  min_playtime: number | null;
  max_playtime: number | null;
  min_age: number | null;
  description: string | null;
  description_preview: string | null;
  thumb_url: string | null;
  image_url: string | null;
  url: string | null;
  price: string | null;
  msrp: number | null;
  discount: number | null;
  primary_publisher: BgaIdWithName | null;
  primary_designer: BgaIdWithName | null;
  mechanics: BgaId[];
  categories: BgaId[];
  artists: string[];
  reddit_all_time_count: number | null;
  reddit_week_count: number | null;
  reddit_day_count: number | null;
}

export interface BgaId {
  id: GameID;
  url: string | null;
}

export interface BgaIdWithName extends BgaId {
  name: string | null;
}

export interface SearchResults {
  games: AtlasGame[];
  count: number;
}

export interface CategoriesResults {
  categories: BgaIdWithName[];
}

export interface MechanicsResults {
  mechanics: BgaIdWithName[];
}

export const emptyAtlasGame: AtlasGame = {
  id: "",
  name: "",
  names: [],
  year_published: null,
  min_players: null,
  max_players: null,
  min_playtime: null,
  max_playtime: null,
  min_age: null,
  description: null,
  description_preview: null,
  thumb_url: null,
  image_url: null,
  url: null,
  price: null,
  msrp: null,
  discount: null,
  primary_publisher: null,
  primary_designer: null,
  mechanics: [],
  categories: [],
  artists: [],
  reddit_all_time_count: null,
  reddit_week_count: null,
  reddit_day_count: null,
};

const BgaBase = "https://api.boardgameatlas.com/api/";

const clientIDParam: BaseParameters = {
  client_id: "SPRafxOinU",
};

enum ApiKey {
  Search = "search",
  Categories = "game/categories",
  Mechanics = "game/mechanics",
}

export interface ApiSearchParameters extends BaseParameters {
  name?: string;
  fuzzy_match?: boolean;
  exact?: boolean;
  random?: boolean;
}

function getUrl(key: ApiKey) {
  return `${BgaBase}${key}`;
}

function formParams<T extends BaseParameters>(param: T) {
  return { ...param, ...clientIDParam };
}

function throttlingDelay() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 2000);
  });
}

export async function search(params: ApiSearchParameters) {
  await throttlingDelay();
  const param = formParams(params);
  return (await get(getUrl(ApiKey.Search), {
    searchParams: param,
  }).json()) as SearchResults;
}

export async function getCategories() {
  await throttlingDelay();
  return (await get(getUrl(ApiKey.Categories), {
    searchParams: clientIDParam,
  }).json()) as CategoriesResults;
}

export async function getMechanics() {
  await throttlingDelay();
  return (await get(getUrl(ApiKey.Mechanics), {
    searchParams: clientIDParam,
  }).json()) as MechanicsResults;
}
