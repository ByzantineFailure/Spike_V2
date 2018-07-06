import {Series} from '../db/series';
import {Season} from '../db/season';

export declare interface Context {
    series: Series|null,
    season: Season|null,
}

