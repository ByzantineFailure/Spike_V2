import {Season} from './season';
import * as sqlite from 'sqlite3';

export declare interface Series {
    id: number|null;
    name: string;
    path: string;
    seasons: Season[];
};

export function listAllSeries(db: sqlite.Database): Promise<Series[]> {
    return new Promise((res, rej) => {
        db.all(`SELECT id, name, path FROM series;`, (err, rows) => {
            if (err) {
                rej(err);
            }
            res(rows.map(row => ({
                id: row.id,
                name: row.name,
                path: row.path,
                seasons: [],
            })));
        });
    });
}

export function insertSeries(db: sqlite.Database, toInsert: Series): Promise<Series> {
    return new Promise((res, rej) => {
        db.serialize(() => {
            db.run(`INSERT INTO series (name, path) VALUES (?, ?);`, 
                [toInsert.name, toInsert.path], (err) => {
                if (err) {
                    rej(err);
                }
            });
            db.get(`SELECT last_insert_rowid();`, (err, row) => {
                if (err) {
                    rej(err);
                }
                res({...toInsert, id: row.id });
            });
        });
    });
}

