import {initializeDatabase} from './lib/db/init';
import {processRoot} from './lib/fs/process_directory';
import {Database} from 'sqlite3';
import {listAllSeries} from './lib/db/series';
import * as process from 'process';

// Closed in main below, must be declared in this scope
let db: Database;

async function main() {
    console.log('initializing database...');
    db = await initializeDatabase();
    console.log('initialized!');
    
    await processRoot('./test_structure', db);
    console.log('processing finished');
    
    const series = await listAllSeries(db);
    console.log('');
    console.log('Series in DB: ');
    for (const entry of series) {
        console.log(`${entry.id} : ${entry.name}`);
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
