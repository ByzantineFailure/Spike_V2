import {Episode} from './episode';

export declare interface Season {
    id: number|null;
    seriesId: number|null;
    name: string;
    path: string;
    episodes: Episode[];
}

