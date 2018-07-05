export declare interface Series {
    id: number|null;
    name: string;
    path: string;
    seasons: Season[];
};

export declare interface Season {
    id: number|null;
    seriesId: number|null;
    name: string;
    path: string;
    episodes: Episode[];
}

export declare interface Episode {
    id: number|null;
    name: string;
    path: string;
    seasonId: number|null;
    seriesId: number|null;
}
