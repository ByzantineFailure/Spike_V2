import * as fs from 'fs';
import * as path from 'path';

// Potential issues:  How deep can a directory tree go, really?  Stack overflow.
export async function walk_tree(
    rootPath: string,
    directoryCallback: (path: string, stats: fs.Stats) => Promise<void>,
    fileCallback: (path: string) => Promise<void>): Promise<void> {

    const stats = await asyncStat(rootPath);

    if (!stats.isDirectory()) {
        fileCallback(rootPath);
        return;
    }
        
    directoryCallback(rootPath, stats);
    const contents = await listDirectoryContents(rootPath);
    for (const child of contents) {
        const childPath = path.join(rootPath, child);
        walk_tree(childPath, directoryCallback, fileCallback);
    }
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

