import * as path from 'path';
import {Database} from 'sqlite3';

import {insertSeries, Series} from '../db/series';
import {insertSeason, Season} from '../db/season';
import {insertEpisode, Episode} from '../db/episode';
import {promptWithDefault, promptYesNo} from './prompt';
import {createDirectory, listDirectoryContents, isDirectory} from '../fs/util';
import {FileMover} from '../fs/file_mover';

export declare interface Context {
    series: Series|null,
    season: Season|null,
}

const EMPTY_CONTEXT: Context = { series: null, season: null };

export async function processRoot(rootPath: string, db: Database, mover: FileMover): Promise<void> {
    if (!await isDirectory(rootPath)) {
        throw new Error('Must call processRoot on a directory, not a file!');
        return;
    }
    
    const contents = await listDirectoryContents(rootPath);
    const context = {...EMPTY_CONTEXT};
    
    for (const child of contents) {
        const childPath = path.join(rootPath, child);
        if (await isDirectory(childPath)) {
            await processDirectory(childPath, context, db, mover);
        } else {
            await processFile(childPath, child, context, db, mover);
        }
    }
}

// Potential issues:  How deep can a directory tree go, really?  Stack overflow.
export async function processDirectory(
    rootPath: string,
    context: Context,
    db: Database,
    mover: FileMover): Promise<void> {
    if (!await isDirectory(rootPath)) {
        throw new Error('Must call processDirectory on a directory, not a file!');
        return;
    }
        
    const currentSeries = context.series ? context.series.name : 'NONE';
    const currentSeason = context.season? context.season.name : 'NONE';
    const contents = await listDirectoryContents(rootPath);

    let currentContext = {...context};
    //let bypassAsking = false;
       
    console.log('');
    console.log('');
    console.log('==================================='); 
    console.log(`Directory - ${rootPath}`);
    console.log(`Current Series - ${currentSeries}`);
    console.log(`Current Season - ${currentSeason}`);
    console.log('===================================');        
    console.log('Files:');
    
    for (const child of contents) {
        console.log(`  ${child}`);
    }

    if (!context.series) {
        currentContext = 
            await assignSeries(path.basename(rootPath), currentContext, db, mover);
    } else if (!context.season) {
        currentContext = 
            await assignSeason(path.basename(rootPath), currentContext, db, mover);
    } 

    /* 
    if (context.season) {
       bypassAsking = await 
        promptYesNo(`Is this entire directory assigned to those things? (y/n)`); 
    }
    */

    for (const child of contents) {
        const childPath = path.join(rootPath, child);
        if (await isDirectory(childPath)) {
            await processDirectory(childPath, currentContext, db, mover);
        } else {
            await processFile(childPath, child, currentContext, db, mover);
        }
    }
}

async function processFile(
    fullPath: string,
    filename: string,
    context: Context, db: Database, mover: FileMover): Promise<void> {
    
    let destination: string;

    if (context.series && context.season) {
        destination = mover.createEpisodePathInSeason(context.series, context.season, filename);
    } else if (context.series) {
        destination = mover.createEpisodePathInSeries(context.series, filename);
    } else {
        destination = mover.createUnclassifiedEpisodePath(filename);
    }

    const episode: Episode = {
        id: null,
        path: destination,
        name: filename,
        seasonId: context.season ? context.season.id : null,
        seriesId: context.series ? context.series.id : null, 
    };
     
    await insertEpisode(db, episode);
    await mover.moveFileToDestination(fullPath, destination);
}

async function assignSeries(
    directoryName: string, context: Context, db: Database, mover: FileMover): Promise<Context> {
    const isSeries = await promptYesNo('Is this directory a series? (y/n)');

    if (isSeries) {
        const seriesName = await getSeriesName(directoryName);
        const seriesPath = mover.createSeriesPath(seriesName);

        console.log('Set series in context to: ' + seriesName);

        const newSeries = await insertSeries(db, {
            id: null,
            name: seriesName,
            path: seriesPath,
            seasons: [],
        });
        
        await createDirectory(seriesPath);

        return {...context, series: newSeries};
    }

    return context;
}

async function getSeriesName(childPath: string): Promise<string> {
    let userSure = false;
    let seriesName = childPath;

    while (!userSure) {
        seriesName = await promptWithDefault(`Enter series name (${childPath}):`, childPath);
        userSure = await promptYesNo(`Set series name set ${seriesName}? (y/n)`)
    }

    return seriesName;
}

async function assignSeason(directoryName: string, context: Context, 
    db: Database, mover: FileMover): Promise<Context> {
    const isSeason = await promptYesNo('Is this directory a season? (y/n)');
    
    if (!context.series || !db) {
        throw new Error('Attempted to assign season outside the context of a series');
    }

    if (isSeason) {
        const seasonName = await getSeasonName(directoryName);
        const seasonPath = mover.createSeasonPath(seasonName, context.series);

        console.log('Set season in context to: ' + seasonName);
        const newSeason = await insertSeason(db, {
            id: null,
            seriesId: context.series.id,
            name: seasonName,
            path: seasonPath,
            episodes: [],
        });

        await createDirectory(seasonPath);

        return {...context, season: newSeason};
    }

    return context;
}

async function getSeasonName(childPath: string): Promise<string> {
    let userSure = false;
    let seasonName = childPath;

    while (!userSure) {
        seasonName = await promptWithDefault(`Enter season name (${childPath}):`, childPath);
        userSure = await promptYesNo(`Set season name set ${seasonName}? (y/n)`)
    }

    return seasonName;
}
