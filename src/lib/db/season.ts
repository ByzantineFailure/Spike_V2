import {Episode} from './episode';
import {Database} from 'sqlite3';

export declare interface Season {
    id: number|null;
    seriesId: number|null;
    name: string;
    path: string;
    episodes: Episode[];
}

export function listSeasons(
    db: Database, seriesId: number, getEpisodes: boolean = false): Promise<Season[]> {
    const query = `
       SELECT id, series_id, name, path 
       FROM season 
       WHERE series_id = ${seriesId};
    `;

    if (getEpisodes) {
        console.log('episodes not yet supported.');
    }

    return new Promise((res, rej) => {
        db.all(query, (err, rows) => {
            if (err) {
                rej(err);
            }
            res(rows.map(row => ({
                id: row.id,
                seriesId: row.seriesId,
                name: row.name,
                path: row.path,
                episodes: [],
            })));
        });
    });

}

export function insertSeason(db: Database, toInsert: Season): Promise<Season> {
    const query = `INSERT INTO season (series_id, name, path) VALUES (?, ?, ?);`;

    return new Promise((res, rej) => {
        db.serialize(() => {
            db.run(query, 
                [toInsert.seriesId, toInsert.name, toInsert.path], (err) => {
                if (err) {
                    rej(err);
                }
            });
            db.get(`SELECT last_insert_rowid() as id;`, (err, row) => {
                if (err) {
                    rej(err);
                }
                res({...toInsert, id: row.id });
            });
        });
    });
}
