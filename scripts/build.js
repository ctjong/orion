const { exec } = require('child_process');

async function mainAsync()
{
    await execAsync(`cd ${__dirname}/../core`, "npm install", "tsc --build tsconfig.json");
    await execAsync(`cd ${__dirname}/../test/client`, "npm install");
    await execAsync(`cd ${__dirname}/../test/server`, "npm install", "npm pack ../../core", "npm install --save orion*.tgz");
}

function execAsync(...commands)
{
    let joined;
    if (process.platform === "win32")
        joined = commands.join(" && ");
    else
        joined = commands.join("; ");
    console.log(`> ${joined}`);
    return new Promise(resolve =>
    {
        exec(joined, (err, stdout, stderr) => 
        {
            if (err)
            {
                console.log("Errors:");
                console.log(err);
                console.log("Stderr:");
                console.log(stderr);
            }
            if (stdout)
            {
                console.log("Stdout:");
                console.log(stdout);
            }
            resolve(err, stdout, stderr)
        });
    });
}

mainAsync();