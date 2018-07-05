import {initializeDatabase} from './lib/db/init';
import {processRoot} from './lib/cli/import_directory';
import {Database} from 'sqlite3';
import {listAllSeries} from './lib/db/series';
import {initTestStructure} from './lib/fs/init_test_structure';
import {FileMover} from './lib/fs/file_mover';
import * as process from 'process';

// Closed in main below, must be declared in this scope
let db: Database;

const DEFAULT_LIBRARY_ROOT = './library';

async function main() {
    await initTestStructure(DEFAULT_LIBRARY_ROOT);

    console.log('initializing database...');
    db = await initializeDatabase();
    console.log('initialized!');
        
    const fileMover = new FileMover(DEFAULT_LIBRARY_ROOT);
    await fileMover.init();

    await processRoot('./test_structure', db, fileMover);
    console.log('processing finished');
    
    const series = await listAllSeries(db, true);
    console.log('');
    console.log('Series in DB: ');
    for (const entry of series) {
        console.log(`${entry.id} : ${entry.name}`);
        console.log(`Seasons: `);
        for (const season of entry.seasons) {
            console.log(`  ${season.id} : ${season.name}`); 
            console.log(`  Episodes:`); 

            for(const episode of season.episodes) {
                console.log(`    ${episode.id} : ${episode.name}`);
            }
            console.log('~~~~~~~~~~~~~~~~~~~~~~~');
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
