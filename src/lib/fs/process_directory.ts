import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import {Database} from 'sqlite3';

import {insertSeries, Series} from '../db/series';
import {Season} from '../db/season';

export declare interface Context {
    series: Series|null,
    season: Season|null,
}

const EMPTY_CONTEXT: Context = { series: null, season: null };

export async function processRoot(rootPath: string, db: Database): Promise<void> {
    if (!await isDirectory(rootPath)) {
        throw new Error('Must call processRoot on a directory, not a file!');
        return;
    }
    
    const contents = await listDirectoryContents(rootPath);
    const context = {...EMPTY_CONTEXT};
    
    for (const child of contents) {
        const childPath = path.join(rootPath, child);
        if (await isDirectory(childPath)) {
            await processDirectory(childPath, context, db);
        } else {
            processFile(childPath, false, context);
        }
    }
}

// Potential issues:  How deep can a directory tree go, really?  Stack overflow.
export async function processDirectory(
    rootPath: string,
    context: Context,
    db: Database): Promise<void> {
    if (!await isDirectory(rootPath)) {
        throw new Error('Must call processDirectory on a directory, not a file!');
        return;
    }
        
    const currentSeries = context.series ? context.series.name : 'NONE';
    const currentSeason = context.season? context.season.name : 'NONE';
    const contents = await listDirectoryContents(rootPath);

    let currentContext = {...context};
    let bypassAsking = false;
       
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
            await assignSeries(rootPath, path.basename(rootPath), currentContext, db);
    } else if (!context.season) {
        currentContext = 
            await assignSeason(rootPath, path.basename(rootPath), currentContext, db);
    } 
    
    if (context.season) {
       bypassAsking = await 
        promptYesNo(`Is this entire directory assigned to those things? (y/n)`); 
    }

    for (const child of contents) {
        const childPath = path.join(rootPath, child);
        if (await isDirectory(childPath)) {
            await processDirectory(childPath, currentContext, db);
        } else {
            processFile(childPath, bypassAsking, currentContext);
        }
    }
}

function processFile(rootPath: string, autoAssign: boolean, context: Context) {
    const currentSeries = context.series ? context.series.name : 'NONE';
    const currentSeason = context.season? context.season.name : 'NONE';

    console.log('Current File: ' + rootPath);
    console.log('autoassign - ' + autoAssign);
    console.log(`Context: SER - ${currentSeries}; SEA - ${currentSeason}`);
}

async function assignSeries(rootPath: string, 
    childPath: string, context: Context, db: Database): Promise<Context> {
    const isSeries = await promptYesNo('Is this directory a series? (y/n)');

    if (isSeries) {
        const seriesName = await getSeriesName(childPath);
        console.log('Set series in context to: ' + seriesName);
        const newSeries = await insertSeries(db, {
            id: null,
            name: seriesName,
            path: rootPath,
            seasons: [],
        });

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

async function assignSeason(rootPath: string, 
    childPath: string, context: Context, 
    db: Database): Promise<Context> {
    const isSeason = await promptYesNo('Is this directory a season? (y/n)');
    
    if (!context.series || !db) {
        throw new Error('Attempted to assign season outside the context of a series');
    }

    if (isSeason) {
        const seasonName = await getSeasonName(childPath);
        console.log('Set season in context to: ' + seasonName);
        return {...context, season: {
            id: null,
            seriesId: context.series.id,
            name: seasonName,
            path: rootPath,
            episodes: [],
        }};
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

function prompt(message: string): Promise<string> {
   console.log(message);
    process.stdin.resume();
    return new Promise((res) => {
        process.stdin.once('data', data => res(data.toString().trim()));
    });
}

async function promptWithDefault(message: string, defaultValue: string): Promise<string> {
    const value = await prompt(message);
    return value || defaultValue;
}

async function promptYesNo(message: string): Promise<boolean> {
    const response = await prompt(message);
    if (response.toLowerCase().startsWith('y')) {
        return true;
    } else if (response.toLowerCase().startsWith('n')) {
        return false;
    } else {
        console.log(`Please respond with a 'y' or 'n'`);
        return await promptYesNo(message);
    }
}

async function isDirectory(rootPath: string): Promise<boolean> {
    const stats = await asyncStat(rootPath);
    return stats.isDirectory();
}

function asyncStat(rootPath: string): Promise<fs.Stats> {
    return new Promise((res, rej) => {
        fs.stat(rootPath, (err, stats) => {
          if (err) {
            rej(err);
          }
          res(stats);
        });
    });
}

function listDirectoryContents(rootPath: string): Promise<string[]> {
    return new Promise((res, rej) => {
        fs.readdir(rootPath, (err, contents) => {
            if (err) {
                rej(err);
            }
            res(contents);
        })
    });
}

