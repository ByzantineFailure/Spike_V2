import * as process from 'process';

export function prompt(message: string): Promise<string> {
   console.log(message);
    process.stdin.resume();
    return new Promise((res) => {
        process.stdin.once('data', data => res(data.toString().trim()));
    });
}

export async function promptWithDefault(message: string, defaultValue: string): Promise<string> {
    const value = await prompt(message);
    return value || defaultValue;
}

export async function promptYesNo(message: string): Promise<boolean> {
    const response = await prompt(message);
    if (response.toLowerCase().startsWith('y')) {
        return true;
    } else if (response.toLowerCase().startsWith('n')) {
        return false;
    } else {
        console.log(`Please respond with a 'y' or 'n'`);
        return await promptYesNo(message);
    }
}
