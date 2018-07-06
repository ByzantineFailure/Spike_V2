import * as path from 'path';
import {Database} from 'sqlite3';

import {insertSeason} from '../db/season';
import {assignSeries} from './get_series';
import {insertEpisode, Episode} from '../db/episode';
import {promptWithDefault, promptYesNo} from './prompt';
import {createDirectory, isDirectory, getChildDirectories, getChildFiles} from '../fs/util';
import {FileMover} from '../fs/file_mover';
import {Context} from './interfaces';

const EMPTY_CONTEXT: Context = { series: null, season: null };

export async function processRoot(rootPath: string, db: Database, mover: FileMover): Promise<void> {
    if (!await isDirectory(rootPath)) {
        throw new Error('Must call processRoot on a directory, not a file!');
        return;
    }
    
    const context = {...EMPTY_CONTEXT};
    const childDirectories = await getChildDirectories(rootPath);
    const childFiles = await getChildFiles(rootPath); 

    for (const child of childDirectories) {
        const childPath = path.join(rootPath, child);
        await processDirectory(childPath, context, db, mover);
    }
    for (const child of childFiles) {
        const childPath = path.join(rootPath, child);
        await processFile(childPath, child, false, context, db, mover);
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

    const childDirectories = await getChildDirectories(rootPath);
    const childFiles = await getChildFiles(rootPath); 

    let currentContext = {...context};
       
    console.log('');
    console.log('');
    console.log('==================================='); 
    console.log(`Directory - ${rootPath}`);
    console.log(`Current Series - ${getSeriesNameFromContext(currentContext)}`);
    console.log(`Current Season - ${getSeasonNameFromContext(currentContext)}`);
    console.log('===================================');        
    console.log('Directories:');
    for (const child of childDirectories) {
        console.log(`  ${child}${path.sep}`);
    } console.log('Files:');
    for (const child of childFiles) {
        console.log(`  ${child}`);
    }

    currentContext = 
        await assignSeries(path.basename(rootPath), currentContext, db, mover);

    if (!currentContext.season && currentContext.series) {
        currentContext = 
            await assignSeason(path.basename(rootPath), currentContext, db, mover);
    } 
    
    console.log('RECAP:');    
    console.log('');
    console.log('==================================='); 
    console.log(`Directory - ${rootPath}`);
    console.log(`Current Series - ${getSeriesNameFromContext(currentContext)}`);
    console.log(`Current Season - ${getSeasonNameFromContext(currentContext)}`);
    console.log('===================================');        

    let bypassAsking: boolean;
    if (childFiles.length > 0) {
       bypassAsking = await 
        promptYesNo(`Are all files in this directory assigned to those things? (y/n)`); 
    } else {
        bypassAsking = false;
    }
    
    const deferredFiles = [];

    for (const file of childFiles) {
        const filePath = path.join(rootPath, file);
        const deferred = await processFile(filePath, file, bypassAsking, currentContext, db, mover);
        if (deferred) {
            deferredFiles.push(file);
        }
    }
    for (const directory of childDirectories) {
        const dirPath = path.join(rootPath, directory);
        await processDirectory(dirPath, currentContext, db, mover);
    }

    for (const file of deferredFiles) {
        const filePath = path.join(rootPath, file);
        await processFile(filePath, file, bypassAsking, currentContext, db, mover);
    }
}

async function processFile(
    fullPath: string,
    filename: string,
    bypassAsking: boolean,
    context: Context, db: Database, mover: FileMover): Promise<boolean> {
        
    if (!bypassAsking) {
        // do the thing here
    }

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
    return false;
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

function getSeriesNameFromContext(context: Context): string {
    return context.series ? context.series.name : 'NONE';
}

function getSeasonNameFromContext(context: Context): string {
    return context.season? context.season.name : 'NONE';
}

