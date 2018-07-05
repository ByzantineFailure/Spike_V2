
export declare interface Episode {
    id: number|null;
    name: string;
    path: string;
    seasonId: number|null;
    seriesId: number|null;
}
/*
import * as sqlite from 'sqlite3';

const INSERT_QUERY = `
  INSERT INTO episode (name, path, series, season) VALUES (?, ?, ?, ?);
`;
export function insertEpisode(db: sqlite.Database, episode: Episode): Promise<Episode> {
    return new Promise((res, rej) => {
      db.run(
          INSERT_QUERY,
          [episode.name, episode.path, episode.seriesId, episode.seasonId],
          (err) => {
          if (err) {
            rej(err);
          }
          console.log(this);
          res({...episode,  id: (this as sqlite.RunResult).lastID});
      });
    });
}
*/
