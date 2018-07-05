import {listSeasons, Season} from './season';
import {Database} from 'sqlite3';

export declare interface Series {
    id: number|null;
    name: string;
    path: string;
    seasons: Season[];
};

export function listAllSeries(db: Database, getSeasons: boolean = false): Promise<Series[]> {
    return new Promise((res, rej) => {
        db.all(`SELECT id, name, path FROM series;`, (err, rows) => {
            if (err) {
                rej(err);
            }

            const allSeries = rows.map(row => ({
                id: row.id,
                name: row.name,
                path: row.path,
                seasons: [],
            }));
            
            if (!getSeasons) {
                res(allSeries);
            } else {
                resolveSeasons(db, allSeries)
                    .then(val => res(val))
                    .catch(err => rej(err));
            }
            
        });
    });
}

function resolveSeasons(db: Database, seriesList: Series[]): Promise<Series[]> {
    return Promise.all(seriesList.map(async series => { 
        const seasons = await listSeasons(db, series.id!);
        return {...series, seasons};
    }));
}

export function insertSeries(db: Database, toInsert: Series): Promise<Series> {
    return new Promise((res, rej) => {
        db.serialize(() => {
            db.run(`INSERT INTO series (name, path) VALUES (?, ?);`, 
                [toInsert.name, toInsert.path], (err) => {
                if (err) {
                    rej(err);
                }
            });
            db.get(`SELECT last_insert_rowid() as id;`, (err, row) => {
                if (err) {
                    rej(err);
                }
                console.log(row);
                res({...toInsert, id: row.id });
            });
        });
    });
}

