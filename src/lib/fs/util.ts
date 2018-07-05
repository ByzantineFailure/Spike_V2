import * as fs from 'fs'
import * as rimraf from 'rimraf';
import * as mkdirp from 'mkdirp';

import {callAsPromise, callAsVoidPromise, callAsVoidPromise2} from '../promisify';

export async function isDirectory(path: string): Promise<boolean> {
    const stats = await asyncStat(path);
    return stats.isDirectory();
}

export function asyncStat(path: string): Promise<fs.Stats> {
    return callAsPromise(fs.stat, path);
}

export function listDirectoryContents(path: string): Promise<string[]> {
    return callAsPromise(fs.readdir, path);
}

export function createDirectory(dirPath: string): Promise<void> {
    return callAsVoidPromise(mkdirp, dirPath);
}

export function createEmptyFile(filePath: string): Promise<void> {
    return callAsVoidPromise2(fs.writeFile, filePath, '');
}

export function removeDirectory(structurePath: string): Promise<void> {
    return callAsVoidPromise(rimraf, structurePath);
}

export async function deleteFile(filepath: string): Promise<void> {
    if (await fileExists(filepath)) {
        await callAsVoidPromise(fs.unlink, filepath);
    }
}

export function moveFile(source: string, destination: string): Promise<void> {
    return callAsVoidPromise2(fs.rename, source, destination);
}

export function fileExists(filepath: string): Promise<boolean> {
    return new Promise(res => {
        fs.exists(filepath, exists => res(exists));
    });
}

