import * as sqlite3 from 'sqlite3';

const sqlite = sqlite3.verbose();

export async function initializeDatabase(path: string = './.spike.db'): Promise<sqlite3.Database> {
    const database = await connect(path);
    await createSeriesTable(database);
    await createSeasonTable(database);
    await createEpisodeTable(database);
    return database;
}

function connect(path: string): Promise<sqlite3.Database> {
   return new Promise((res, rej) => {
    const db = new sqlite.Database(path, (err) => {
        if (err) {
            rej(err);
            return;
        }

        console.log('connection to database succesful');
        res(db);
    });
   });
}

function createSeriesTable(db: sqlite3.Database): Promise<void> {
   const query = `
     CREATE TABLE IF NOT EXISTS series (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       name TEXT NOT NULL UNIQUE,
       path TEXT NOT NULL
     );
   `;
    return runQuery(db, query);
}

function createSeasonTable(db: sqlite3.Database): Promise<void> {
    const query = `
       CREATE TABLE IF NOT EXISTS season (
         id INTEGER PRIMARY KEY AUTOINCREMENT, 
         name TEXT NOT NULL,
         path TEXT NOT NULL,
         series INTEGER NOT NULL,
         FOREIGN KEY(series) REFERENCES series(id) ON DELETE CASCADE
       );
    `;
    return runQuery(db, query);
}

function createEpisodeTable(db: sqlite3.Database): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS episode (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        series INTEGER,
        season INTEGER,
        FOREIGN KEY(series) REFERENCES series(id) ON DELETE CASCADE,
        FOREIGN KEY(season) REFERENCES season(id) ON DELETE CASCADE);
    `;
    return runQuery(db, query);
}

function runQuery(db: sqlite3.Database, query: string): Promise<void> {
    return new Promise((res, rej) => {
        db.run(query, (err) => {
            if(err) {
                rej(err);
            }
            res();
        });
    });
}
