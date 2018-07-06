import {Database} from 'sqlite3';
import * as similarity from 'string-similarity';

import {FileMover} from '../fs/file_mover';
import {createDirectory} from '../fs/util';
import {listAllSeries, getSeriesByName, insertSeries, Series} from '../db/series';
import {promptWithDefault, promptForNumber, promptYesNo} from './prompt';
import {Context} from './interfaces';

export async function assignSeries(
    directoryName: string, context: Context, db: Database, mover: FileMover): Promise<Context> {
    // If we have a series in context, ask the user if the current directory is part of it
    // If it is, no need to go any further.
    if(context.series) {
        const isPartOfCurrentSeries = 
        await promptYesNo(`Is this part of the current series: ${context.series.name} (y/n)?`);
        if (isPartOfCurrentSeries) {
            return {...context};
        }
    }

    const isSeries = await promptYesNo('Does this directory contain episodes from a series?  You will have a chance to make changes to this designation on a file-level if needed. (y/n)');
    
    if (!isSeries) {
        return context;
    }
    
    const allSeries = await listAllSeries(db, false);
    const allSeriesNames =  allSeries.map(series => series.name);
    
    let similarSeries: similarity.Rating[];

    if(allSeriesNames.length > 0) {
        similarSeries = similarity.findBestMatch(directoryName, allSeriesNames)
            .ratings.sort((a, b) => b.rating - a.rating).slice(0, 5);
    } else {
        similarSeries = [];
    }

    const numberOfOptions = similarSeries.length + 3;
         
    console.log(`Best guess existing series:`);
    console.log(`==========================`);
    let i = 0;
    for (; i < similarSeries.length; i++) {
        console.log(`${i + 1}. ${similarSeries[i].target}`);
    }
    console.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~`);
    console.log(`${i + 1}. List and pick from all series`);
    console.log(`${i + 2}. Add a new series`);
    console.log(`${i + 3}. Not a series`);
    
    const optionSelected = await promptForNumber(
        `Select an option [1-${numberOfOptions}]:`, 1, numberOfOptions);
    
    let series: Series;

    if (optionSelected <= similarSeries.length) {
        const lookupResult = await getSeriesByName(db, similarSeries[optionSelected - 1].target, true);
        if (lookupResult === null) {
            throw new Error('Series lookup by name from object in database return null during series assignment from similar strings.');
        }
        series = lookupResult;
    // Get from all series
    } else if (optionSelected === similarSeries.length + 1) {
        const existingSeriesResult = await getSeriesFromNameList(allSeries, db, mover, directoryName);
        if (existingSeriesResult === null) {
            return {...context};
        }
        series = existingSeriesResult;
    // Add a new series
    } else if (optionSelected === similarSeries.length + 2) {
        series = await addNewSeries(db, mover, directoryName);
    // Not a series
    } else {
        return {...context};
    }
    
    console.log('Set series in context to: ' + series.name);
    
    return {...context, series };
}

async function getSeriesFromNameList(allSeries: Series[], 
    db: Database, 
    mover: FileMover, 
    directoryName: string): Promise<Series|null> {
    console.log('All known series:')
    console.log('========================');

    let i = 1;
    for (; i <= allSeries.length; i++) {
       console.log(`${i}. ${allSeries[i - 1].name}`); 
    }
    console.log(`${i}. None of these (Create new)`);
    console.log(`${i + 1}. None of these (not a series)`);
    
    const selectedOption = await promptForNumber(
        `Select an option [1 - ${allSeries.length + 2}]:`, 1, allSeries.length + 2);
    
    if (selectedOption <= allSeries.length) {
        return allSeries[selectedOption - 1];
    } else if (selectedOption === allSeries.length + 1) {
        return addNewSeries(db, mover, directoryName);
    } else {
        return null; 
    }
}

async function addNewSeries(db: Database, mover: FileMover, directoryName: string): Promise<Series> {
    const seriesName = await getNewSeriesName(directoryName);
    const seriesPath = mover.createSeriesPath(seriesName);

    const newSeries = await insertSeries(db, {
        id: null,
        name: seriesName,
        path: seriesPath,
        seasons: [],
    });
    
    await createDirectory(seriesPath);
    
    return newSeries;
}

async function getNewSeriesName(childPath: string): Promise<string> {
    let userSure = false;
    let seriesName = childPath;

    while (!userSure) {
        seriesName = await promptWithDefault(`Enter series name (${childPath}):`, childPath);
        userSure = await promptYesNo(`Set series name set ${seriesName}? (y/n)`)
    }

    return seriesName;
}

