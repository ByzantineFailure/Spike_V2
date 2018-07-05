import * as path from 'path';
import * as fsUtil from './util';
import {Series} from '../db/series';
import {Season} from '../db/season';

const UNCLASSIFIED_DIR_NAME = 'unclassified';

export class FileMover {
    
    private readonly unclassifiedPath = 
        path.join(this.libraryRoot, UNCLASSIFIED_DIR_NAME);

    constructor(private readonly libraryRoot: string) {}
     
    async init(): Promise<void> {
        await fsUtil.createDirectory(this.libraryRoot);
        await fsUtil.createDirectory(this.unclassifiedPath);
    }

    createSeriesPath(seriesName: string): string {
       return path.join(this.libraryRoot, seriesName);
    }

    createSeasonPath(seasonName: string, series: Series): string {
        return path.join(this.createSeriesPath(series.name), seasonName);
    }

    createEpisodePathInSeason(series: Series, season: Season, name: string): string {
        return path.join(this.createSeasonPath(season.name, series), name);
    }

    createEpisodePathInSeries(series: Series, name: string): string {
        return path.join(this.createSeriesPath(series.name), name);
    }

    createUnclassifiedEpisodePath(name: string): string {
        return path.join(this.unclassifiedPath, name);
    }

    moveFileToDestination(source: string, destination: string): Promise<void> {
        return fsUtil.moveFile(source, destination);
    }
}
