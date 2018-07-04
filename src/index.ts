import {initializeDatabase} from './lib/db/init';
import {walk_tree} from './lib/fs/walk_tree';
import {Database} from 'sqlite3';

import {Stats} from 'fs';

let db: Database;

async function main() {
    console.log('initializing database...');
    db = await initializeDatabase();
    console.log('initialized!');
    await walk_tree('./src', 
        dir,
        file,
    );
}

function dir(path: string, stats: Stats): Promise<void> {
    return new Promise(res => {
        if(stats) {
            console.log('dir: ' + path);
        }
        res();
    });
}

function file(path: string): Promise<void> {
    return new Promise(res => {
        console.log('file: ' + path);
        res();
    });
}

main().then(() => { 
    db.close(); 
}).catch(err => {
    console.log(err);
    db.close();
});
