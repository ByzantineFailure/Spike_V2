import * as sqlite3 from 'sqlite3';

const sqlite = sqlite3.verbose();

export async function initializeDatabase(path: string = '.'): Promise<sqlite3.Database> {
    const database = await connect(path);
    
    createSeriesTable(database);
    createSeasonTable(database);
    createEpisodeTable(database);

    return database;
}

function connect(path: string): Promise<sqlite3.Database> {
   return new Promise((res, rej) => {
    const db = new sqlite.Database(path, (err) => {
        if (err) {
            rej(`Error connecting to sqlite database at path ${path}`);
            return;
        }

        console.log('connection to database succesful');
        res(db);
    });
   });
}

function createSeriesTable(db: sqlite3.Database): void {
   const query = `
     CREATE TABLE IF NOT EXISTS series (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       name TEXT NOT NULL,
       path TEXT NOT NULL
     );
   `;
    db.run(query);
}

function createSeasonTable(db: sqlite3.Database): void {
    const query = `
       CREATE TABLE IF NOT EXISTS season (
         id INTEGER PRIMARY KEY AUTOINCREMENT, 
         name TEXT NOT NULL,
         path TEXT NOT NULL,
         series INTEGER NOT NULL,
         FOREIGN KEY(series) REFERENCES series(id) ON DELETE CASCADE
       );
    `;

    db.run(query);
}

function createEpisodeTable(db: sqlite3.Database): void {
    const query = `
      CREATE TABLE IF NOT EXISTS episode (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        series INTEGER NOT NULL,
        season INTEGER
        FOREIGN KEY(series) REFERENCES series(id) ON DELETE CASCADE,
        FOREIGN KEY(season) REFERENCES season(id) ON DELETE CASCADE
    `;

    db.run(query);
}
