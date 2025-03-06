import fetch from 'node-fetch';
import fs from 'fs';
import ora from 'ora';
import readline from 'readline';
import cfonts from "cfonts";
import chalk from "chalk";

const AGENT_IDS = [
    "deployment_fseGykIvCLs3m9Nrpe9Zguy9",
    "deployment_R89FtdnXa7jWWHyr97WQ9LKG"
];

const messages = fs.readFileSync("NTE-Pesan.txt", "utf-8").split("\n").map(m => m.trim()).filter(Boolean);
const walletAddresses = fs.readFileSync("NTE-Wallet.txt", "utf-8").split("\n").map(addr => addr.trim()).filter(Boolean);
const proxies = fs.existsSync("proxy.txt") ? fs.readFileSync("proxy.txt", "utf-8").split("\n").map(p => p.trim()).filter(Boolean) : [];
const proxy = proxies.length > 0 ? proxies[Math.floor(Math.random() * proxies.length)] : null;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchResponse(message) {
    const spinner = ora("Fetching AI response...").start();
    try {
        const requestBody = { message, stream: true };
        const fetchOptions = {
            method: "POST",
            headers: {
                "accept": "text/event-stream",
                "content-type": "application/json",
                "origin": "https://agents.testnet.gokite.ai",
                "referer": "https://agents.testnet.gokite.ai/",
            },
            body: JSON.stringify(requestBody)
        };
        
        if (proxy) {
            fetchOptions.agent = new (require('https-proxy-agent'))(proxy);
        }

        const response = await fetch("https://deployment-r89ftdnxa7jwwhyr97wq9lkg.stag-vxzy.zettablock.com/main", fetchOptions);
        const text = await response.text();
        const result = text.match(/"content":\s*"(.*?)"/g)?.map(m => m.replace(/"content":\s*"|"/g, ''))?.join(' ') || "";
        spinner.succeed("AI response received.");
        return result;
    } catch (error) {
        spinner.fail("Failed to fetch AI response.");
        throw error;
    }
}

async function reportUsage(message, responseText, agentId, walletAddress) {
    const spinner = ora("Reporting usage...").start();
    try {
        const reportBody = {
            agent_id: agentId,
            request_metadata: {},
            request_text: message,
            response_text: responseText,
            total_time: 3538.2,
            ttft: 1219.5,
            wallet_address: walletAddress
        };
        
        const response = await fetch("https://quests-usage-dev.prod.zettablock.com/api/report_usage", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(reportBody)
        });
        const data = await response.json();
        spinner.succeed("Usage report successfully recorded.");
        return data;
    } catch (error) {
        spinner.fail("Failed to report usage.");
        throw error;
    }
}

async function fetchInference(id, attempt) {
    const spinner = ora(`Fetching inference (attempt ${attempt})...`).start();
    await delay(5000);
    try {
        const response = await fetch(`https://neo.prod.zettablock.com/v1/inference?id=${id}`);
        const data = await response.json();
        spinner.succeed(`Inference ${attempt} received.`);
        return data;
    } catch (error) {
        spinner.fail(`Inference ${attempt} failed.`);
        throw error;
    }
}

async function fetchStats(walletAddress) {
    const spinner = ora("Fetching user stats...").start();
    try {
        const response = await fetch(`https://quests-usage-dev.prod.zettablock.com/api/user/${walletAddress}/stats`);
        const data = await response.json();
        spinner.succeed("User stats fetched successfully.");
        return data;
    } catch (error) {
        spinner.fail("Failed to fetch user stats.");
        throw error;
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
cfonts.say('NT Exhaust', {
    font: 'block',
    align: 'center',
    colors: ['cyan', 'magenta'],
    background: 'black',
    letterSpacing: 1,
    lineHeight: 1,
    space: true,
    maxLength: '0',
  });

  console.log(chalk.green("=== Telegram Channel : NT Exhaust ( @NTExhaust ) ===\n"));
rl.question("Enter the number of loops: ", async (loopsInput) => {
    const TOTAL_LOOPS = parseInt(loopsInput, 10) || 1;
    rl.close();
    
    (async () => {
        try {
            let interactionCounter = 1;
            for (const walletAddress of walletAddresses) {
                for (let i = 0; i < TOTAL_LOOPS; i++) {
                    console.log(`Processing interaction ${interactionCounter} of ${TOTAL_LOOPS * walletAddresses.length}`);
                    const agentId = AGENT_IDS[Math.floor(Math.random() * AGENT_IDS.length)];
                    const message = messages[Math.floor(Math.random() * messages.length)];
                    
                    const responseText = await fetchResponse(message);
                    const report = await reportUsage(message, responseText, agentId, walletAddress);
                    const inferenceId = report.interaction_id;
                    
                    await fetchInference(inferenceId, 1);
                    await fetchInference(inferenceId, 2);
                    console.log("=== Telegram Channel : NT Exhaust ( @NTExhaust ) ===\n")
                    const stats = await fetchStats(walletAddress);
                    console.log("📊 User Interaction Stats:", stats);
                    
                    console.log("✔ Operation successful!");
                    console.log("=== Telegram Channel : NT Exhaust ( @NTExhaust ) ===\n")
                    interactionCounter++;
                    await delay(10000);
                }
            }
        } catch (error) {
            console.error("Error:", error);
        }
    })();
});
