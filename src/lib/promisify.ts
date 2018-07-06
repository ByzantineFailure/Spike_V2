
interface VoidNodeCallback {
    (err: NodeJS.ErrnoException): void
}

interface VoidCall<T> {
    (arg: T, callback: VoidNodeCallback): void
}

interface VoidCall2<S, T> {
    (arg1: S, arg2: T, cb: VoidNodeCallback): void
}

export function callAsVoidPromise<T>(call: VoidCall<T>, arg: T): Promise<void> {
    return new Promise((res, rej) => {
        call(arg, err => {
            if (err) {
                rej(err);
                return;
            }
            res();
        });
    });
}

export function callAsVoidPromise2<S, T>(call: VoidCall2<S, T>, arg1: S, arg2: T): Promise<void> {
    return new Promise((res, rej) => {
        call(arg1, arg2, err => {
            if (err) {
                rej(err);
                return;
            }
            res();
        });
    });
}

interface NodeCallback<T> {
    (err?: NodeJS.ErrnoException, data?: T): void
}

interface Call<S, T> {
    (arg1: S, cb: NodeCallback<T>): void
}

interface Call2<S, R, T> {
    (arg1: S, arg2: R, cb: NodeCallback<T>): void
}

export function callAsPromise<S, T>(call: Call<S, T>, arg1: S): Promise<T> {
   return new Promise((res, rej) => { 
       call(arg1, (err, data) => {
            if (err) {
                rej(err);
                return;
            }
           res(data);
       });
   });
}

export function callAsPromise2<S, R, T>(call: Call2<S, R, T>, arg1: S, arg2: R): Promise<T> {
    return new Promise((res, rej) => {
        call(arg1, arg2, (err, data) => {
            if (err) {
                rej(err);
                return;
            }
           res(data);
        });
    });
}

