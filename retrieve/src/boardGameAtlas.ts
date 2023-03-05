import get, { SearchParameters as BaseParameters } from "got";

export interface Game {
  id: string;
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
  id: string;
  url: string | null;
}

export interface BgaIdWithName extends BgaId {
  name: string | null;
}

export interface SearchResults {
  games: Game[];
  count: number;
}

export interface CategoriesResults {
  categories: BgaIdWithName[];
}

export interface MechanicsResults {
  mechanics: BgaIdWithName[];
}

const BgaBase = "https://api.boardgameatlas.com/api/";

const clientIDParam: BaseParameters = {
  client_id: "SPRafxOinU",
};

enum ApiKey {
  Search = "search",
  Categories = "categories",
  Mechanics = "mechanics",
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

export async function search(params: ApiSearchParameters) {
  try {
    const param = formParams(params);
    const games: SearchResults = await get(getUrl(ApiKey.Search), {
      searchParams: param,
    }).json();
    return games;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function categories() {
  try {
    const categories: CategoriesResults = await get(getUrl(ApiKey.Categories), {
      searchParams: clientIDParam,
    }).json();
    return categories;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function mechanics() {
  try {
    const mechanics: MechanicsResults = await get(getUrl(ApiKey.Mechanics), {
      searchParams: clientIDParam,
    }).json();
    return mechanics;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
