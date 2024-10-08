const { exec } = require('child_process');

async function main() {
    exec('bun run push', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error}`);
            return;
        }
        console.log(`Command output: ${stdout}`);
        console.error(`Command error output: ${stderr}`);
    });
}

main();
setInterval(main, 15 * 60 * 1000);