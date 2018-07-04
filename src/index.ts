import {initializeDatabase} from './lib/db/init';

initializeDatabase().then(() => {
    console.log('initialized!');
});
