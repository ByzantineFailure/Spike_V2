import {Database} from 'sqlite3';

export declare interface Episode {
    id: number|null;
    name: string;
    path: string;
    seasonId: number|null;
    seriesId: number|null;
}

const INSERT_QUERY = `
  INSERT INTO episode (name, path, series_id, season_id) VALUES (?, ?, ?, ?);
`;
export function insertEpisode(db: Database, toInsert: Episode): Promise<Episode> {
    return new Promise((res, rej) => {
        db.serialize(() => {
          db.run(
              INSERT_QUERY,
              [toInsert.name, toInsert.path, toInsert.seriesId, toInsert.seasonId],
              (err) => {
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

export function getEpisodesInSeason(db: Database, seasonId: number): Promise<Episode[]> {
    const query = `
        SELECT id, name, path, series_id, season_id FROM episode WHERE season_id = ${seasonId};
    `;
    return new Promise((res, rej) => { 
        db.all(query, (err, rows) => {
            if (err) {
                rej(err);
            }
            res(rows.map(row => ({
                id: row.id,
                name: row.name,
                path: row.path,
                seriesId: row.series_id,
                seasonId: row.season_id,
            })));
        });
    });
}

export function getEpisodesInSeries(db: Database, seriesId: number): Promise<Episode[]> {
    const query = `
        SELECT id, name, path, series_id, season_id FROM episode WHERE series_id = ${seriesId};
    `;
    return new Promise((res, rej) => { 
        db.all(query, (err, rows) => {
            if (err) {
                rej(err);
            }
            res(rows.map(row => ({
                id: row.id,
                name: row.name,
                path: row.path,
                seriesId: row.series_id,
                seasonId: row.season_id,
            })));
        });
    });
}

