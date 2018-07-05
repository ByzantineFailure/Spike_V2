import {initializeDatabase} from './lib/db/init';
import {processRoot} from './lib/cli/import_directory';
import {Database} from 'sqlite3';
import {listAllSeries} from './lib/db/series';
import {initTestStructure, deleteOldDatabase} from './lib/fs/init_test_structure';
import * as process from 'process';

// Closed in main below, must be declared in this scope
let db: Database;

async function main() {
    await deleteOldDatabase();
    await initTestStructure();

    console.log('initializing database...');
    db = await initializeDatabase();
    console.log('initialized!');
    
    await processRoot('./test_structure', db);
    console.log('processing finished');
    
    const series = await listAllSeries(db, true);
    console.log('');
    console.log('Series in DB: ');
    for (const entry of series) {
        console.log(`${entry.id} : ${entry.name}`);
        console.log(`Seasons: `);
        for (const season of entry.seasons) {
            console.log(`${season.id} : ${season.name}`); 
        }
        console.log('========================');
    }
}

main().then(() => { 
    db.close(); 
    process.exit(0);
}).catch(err => {
    console.log(err);
    db.close();
    process.exit(1);
});
