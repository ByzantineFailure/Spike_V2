import * as path from 'path';

import {removeDirectory, createEmptyFile, createDirectory, deleteFile} from './util';

export const TEST_BASE = 'test_structure';

export const TWO_SEASON_SERIES_DIR_NAME = 'thing1';
export const TWO_SEASON_SERIES_S1_DIR_NAME = 's1';
export const TWO_SEASON_SERIES_S2_DIR_NAME = 's2';

export const NO_SEASON_SERIES_DIR_NAME = 'thing2';

export async function initTestStructure(libraryRoot: string, basePath: string = '.'): Promise<void> {
    const structurePath = path.join(basePath, TEST_BASE);
    
    // Remove any old structure that exists
    await removeDirectory(structurePath);

    // Create our base directory
    await createDirectory(structurePath); 
    
    await createSeriesWithTwoSeasons(structurePath);
    await createSeriesWithNoSeasons(structurePath);

    // Delete the old database
    await deleteOldDatabase(basePath);

    // Delete the old root directory
    await removeDirectory(libraryRoot);
}

export async function deleteOldDatabase(basePath: string): Promise<void> {
   await deleteFile(path.join(basePath, '.spike.db')); 
}

async function createSeriesWithTwoSeasons(structurePath: string): Promise<void> {
    const seriesPath = path.join(structurePath, TWO_SEASON_SERIES_DIR_NAME);
    const seasonOnePath = path.join(seriesPath, TWO_SEASON_SERIES_S1_DIR_NAME);
    const seasonTwoPath = path.join(seriesPath, TWO_SEASON_SERIES_S2_DIR_NAME);

    await createDirectory(seriesPath);
    await createDirectory(seasonOnePath);
    await createDirectory(seasonTwoPath);

    await createFiveFilesInDirectory(seasonOnePath);
    await createFiveFilesInDirectory(seasonTwoPath);
}

async function createSeriesWithNoSeasons(structurePath: string): Promise<void> {
    const seriesPath = path.join(structurePath, NO_SEASON_SERIES_DIR_NAME);

    await createDirectory(seriesPath);
    await createFiveFilesInDirectory(seriesPath);
}

async function createFiveFilesInDirectory(directoryPath: string): Promise<void[]> {
    return Promise.all([1, 2, 3, 4, 5].map(i => {
        const filename = `file ${i}.txt`; 
        const filePath = path.join(directoryPath, filename);
        return createEmptyFile(filePath);
    }));
}

