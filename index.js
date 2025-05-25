import figlet from 'figlet';
import fs from 'fs/promises';
import { createInterface } from 'readline/promises';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ethers } from 'ethers';
import randomUseragent from 'random-useragent';
import ora from 'ora';
import chalk from 'chalk';
import moment from 'moment-timezone';
import crypto from 'crypto';
import { createParser } from 'eventsource-parser';


function getTimestamp() {
  return moment().tz('Asia/Jakarta').format('D/M/YYYY, HH:mm:ss');
}

function displayBanner() {
  const width = process.stdout.columns || 80;
  const banner = figlet.textSync('\n NT EXHAUST', { font: "ANSI Shadow", horizontalLayout: 'Speed' });
  banner.split('\n').forEach(line => {
    console.log(chalk.cyanBright(line.padStart(line.length + Math.floor((width - line.length) / 2))));
  });
  console.log(chalk.cyanBright(' '.repeat((width - 50) / 2) + '=== Telegram Channel 🚀 : NT Exhaust ( @NTExhaust ) ==='));
  console.log(chalk.yellowBright(' '.repeat((width - 30) / 2) + '✪ KITE AI AUTO DAILY QUIZ & CHAT AI ✪\n'));
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function promptUser(question) {
  const answer = await rl.question(chalk.white(question));
  return answer.trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeText(text, color, noType = false) {
  if (isSpinnerActive) await sleep(500);
  const maxLength = 80;
  const displayText = text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  if (noType) {
    console.log(color(` ┊ │ ${displayText}`));
    return;
  }
  const totalTime = 200;
  const sleepTime = displayText.length > 0 ? totalTime / displayText.length : 1;
  console.log(color(' ┊ ┌── Response Chat API ──'));
  process.stdout.write(color(' ┊ │ '));
  for (const char of displayText) {
    process.stdout.write(char);
    await sleep(sleepTime);
  }
  process.stdout.write('\n');
  console.log(color(' ┊ └──'));
}

function createProgressBar(current, total) {
  const barLength = 30;
  const filled = Math.round((current / total) * barLength);
  return `[${'█'.repeat(filled)}${' '.repeat(barLength - filled)} ${current}/${total}]`;
}

function displayHeader(text, color, forceClear = false) {
  if (isSpinnerActive) return;
  if (forceClear) console.clear();
  console.log(color(text));
}

function isValidPrivateKey(pk) {
  return /^0x[a-fA-F0-9]{64}$|^[a-fA-F0-9]{64}$/.test(pk);
}

function generateAuthToken(message, secretKey) {
  const key = Buffer.from(secretKey, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv, {
    authTagLength: 16
  });
  let encrypted = cipher.update(message, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  const result = Buffer.concat([iv, encrypted, authTag]);
  return result.toString('hex');
}

let isSpinnerActive = false;

async function clearConsoleLine() {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
}

async function getSmartAccountAddress(eoa, proxy = null) {
  await sleep(500);
  await clearConsoleLine();
  const spinChars = ['|', '/', '-', '\\'];
  let spinIndex = 0;
  let spinTimeout;
  isSpinnerActive = true;
  async function spin() {
    if (!isSpinnerActive) return;
    process.stdout.write(chalk.cyan(` ┊ → Mengambil smart account address... ${spinChars[spinIndex]}\r`));
    spinIndex = (spinIndex + 1) % spinChars.length;
    spinTimeout = setTimeout(spin, 120);
  }
  spin();
  try {
    const payload = {
      jsonrpc: "2.0",
      id: 0,
      method: "eth_call",
      params: [
        {
          data: `0x8cb84e18000000000000000000000000${eoa.slice(2)}4b6f5b36bb7706150b17e2eecb6e602b1b90b94a4bf355df57466626a5cb897b`,
          to: "0x948f52524Bdf595b439e7ca78620A8f843612df3",
        },
        "latest",
      ],
    };
    let config = { headers: { 'Content-Type': 'application/json' } };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const response = await axios.post('https://rpc-testnet.gokite.ai/', payload, config);
    const result = response.data.result;
    if (!result || result === '0x') throw new Error('Invalid eth_call response');
    const aa_address = '0x' + result.slice(26);
    await clearConsoleLine();
    clearTimeout(spinTimeout);
    await clearConsoleLine();
    console.log(chalk.green(` ┊ ✓ Smart account address: ${aa_address.slice(0, 8)}...`));
    await sleep(500);
    return aa_address;
  } catch (err) {
    await clearConsoleLine();
    clearTimeout(spinTimeout);
    await clearConsoleLine();
    console.log(chalk.red(` ┊ ✗ Gagal mengambil smart account address: ${err.message}`));
    await sleep(500);
    throw err;
  } finally {
    isSpinnerActive = false;
    await clearConsoleLine();
  }
}

async function authenticate(eoa, privateKey, proxy = null, retryCount = 0) {
  const maxRetries = 5;
  await clearConsoleLine();
  const spinChars = ['|', '/', '-', '\\'];
  let spinIndex = 0;
  let spinTimeout;
  isSpinnerActive = true;
  async function spin() {
    if (!isSpinnerActive) return;
    process.stdout.write(chalk.cyan(` ┊ → Mengautentikasi${retryCount > 0 ? ` [Retry ke-${retryCount}/${maxRetries}]` : ''}... ${spinChars[spinIndex]}\r`));
    spinIndex = (spinIndex + 1) % spinChars.length;
    spinTimeout = setTimeout(spin, 120);
  }
  spin();
  try {
    await clearConsoleLine();
    clearTimeout(spinTimeout);
    isSpinnerActive = false;
    await clearConsoleLine();
    const aa_address = await getSmartAccountAddress(eoa, proxy);
    const secretKey = '6a1c35292b7c5b769ff47d89a17e7bc4f0adfe1b462981d28e0e9f7ff20b8f8a';
    const authToken = generateAuthToken(eoa, secretKey);
    let config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        'Authorization': authToken,
        'Origin': 'https://testnet.gokite.ai',
        'Referer': 'https://testnet.gokite.ai/',
        'User-Agent': randomUseragent.getRandom(),
      },
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const payload = { eoa, aa_address };
    isSpinnerActive = true;
    spin();
    const response = await axios.post('https://neo.prod.gokite.ai/v2/signin', payload, config);
    const { aa_address: response_aa_address, access_token } = response.data.data;
    if (!response_aa_address || !access_token) throw new Error('Invalid response: aa_address or access_token missing');
    await clearConsoleLine();
    clearTimeout(spinTimeout);
    await clearConsoleLine();
    console.log(chalk.green(` ┊ ✓ Autentikasi berhasil: aa_address=${response_aa_address.slice(0, 8)}...`));
    await sleep(500);
    return { aa_address: response_aa_address, access_token };
  } catch (err) {
    if (retryCount < maxRetries - 1) {
      await clearConsoleLine();
      clearTimeout(spinTimeout);
      await clearConsoleLine();
      process.stdout.write(chalk.cyan(` ┊ → Mengautentikasi [Retry ke-${retryCount + 1}/${maxRetries}] ${spinChars[spinIndex]}\r`));
      await sleep(5000);
      return authenticate(eoa, privateKey, proxy, retryCount + 1);
    }
    await clearConsoleLine();
    clearTimeout(spinTimeout);
    await clearConsoleLine();
    console.log(chalk.red(` ┊ ✗ Gagal autentikasi: ${err.message}`));
    await sleep(500);
    throw err;
  } finally {
    clearTimeout(spinTimeout);
    isSpinnerActive = false;
    await clearConsoleLine();
  }
}

async function login(eoa, aa_address, access_token, proxy = null, retryCount = 0) {
  const maxRetries = 5;
  await clearConsoleLine();
  const spinner = ora({ text: chalk.cyan(` ┊ → Login${retryCount > 0 ? ` [Retry ke-${retryCount}/${maxRetries}]` : ''}`), prefixText: '', spinner: 'bouncingBar', interval: 120 }).start();
  isSpinnerActive = true;
  try {
    let config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const payload = {
      registration_type_id: 1,
      user_account_id: "",
      user_account_name: "",
      eoa_address: eoa,
      smart_account_address: aa_address,
      referral_code: "",
    };
    const response = await axios.post('https://ozone-point-system.prod.gokite.ai/auth', payload, config);
    const profile = response.data.data.profile;
    if (!profile) throw new Error('Invalid response: profile missing');
    spinner.succeed(chalk.green(` ┊ ✓ Login Succesfully!`));
    await sleep(500);
    return profile;
  } catch (err) {
    if (err.response?.data?.error === 'User already exists') {
      spinner.succeed(chalk.green(` ┊ ✓ Login Succesfully!`));
      await sleep(500);
      return { user_id: 'existing_user', eoa, aa_address };
    }
    if (retryCount < maxRetries - 1) {
      spinner.text = chalk.cyan(` ┊ → Login [Retry ke-${retryCount + 1}/${maxRetries}]`);
      await sleep(5000);
      return login(eoa, aa_address, access_token, proxy, retryCount + 1);
    }
    spinner.fail(chalk.red(` ┊ ✗ Gagal login: ${err.message}`));
    await sleep(500);
    throw err;
  } finally {
    spinner.stop();
    isSpinnerActive = false;
    await clearConsoleLine();
  }
}


async function chatWithAI(access_token, service_id, message, proxy = null, retryCount = 0) {
  const maxRetries = 5;
  await clearConsoleLine();
  const spinner = ora({
    text: chalk.cyan(` ┊ → Mengirim chat ke ${service_id.slice(0, 20)}...${retryCount > 0 ? ` [Retry ke-${retryCount}/${maxRetries}]` : ''}`),
    prefixText: '',
    spinner: 'bouncingBar',
    interval: 120
  }).start();
  isSpinnerActive = true;
  const isSherlock = service_id === "deployment_OX7sn2D0WvxGUGK8CTqsU5VJ";

  try {
    const config = {
      headers: {
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
        'User-Agent': randomUseragent.getRandom(),
      },
      responseType: 'stream',
    };
    
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }

    const payload = {
      service_id,
      subnet: "kite_ai_labs",
      stream: true,
      body: { stream: true, message },
    };
    const response = await axios.post(
      'https://ozone-point-system.prod.gokite.ai/agent/inference',
      payload,
      config
    );

    let fullResponse = '';
    let buffer = '';
    response.data.on('data', chunk => {
      buffer += chunk.toString('utf8');
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop();

      for (const part of parts) {
        if (!part.startsWith('data:')) continue;
        const data = part.replace(/^data:\s*/, '').trim();
        if (data === '[DONE]') continue;

        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;
          if (!delta) continue;
          fullResponse += delta;
          if (!isSherlock) {
          spinner.clear();
          spinner.render();
          }
        } catch {
        }
      }
    });
    
    await new Promise((resolve, reject) => {
      response.data.on('end', resolve);
      response.data.on('error', reject);
    });

    spinner.succeed(chalk.green(` ┊ ✓ Chat Terkirim Ke Agent ${service_id.slice(0, 20)}...`));
    await sleep(500);
    return fullResponse;
  } catch (err) {
    spinner.fail(chalk.red(` ┊ ✗ Gagal chat: ${err.message}`));
    await sleep(500);
    if (retryCount < maxRetries - 1) {
      return chatWithAI(access_token, service_id, message, proxy, retryCount + 1);
    }
    throw err;

  } finally {
    spinner.stop();
    isSpinnerActive = false;
    await clearConsoleLine();
  }
}


async function submitReport(aa_address, service_id, message, aiResponse, access_token, proxy = null, retryCount = 0) {
  const maxRetries = 5;
  await clearConsoleLine();
  const spinner = ora({ text: chalk.cyan(` ┊ → Submit Report${retryCount > 0 ? ` [Retry ke-${retryCount}/${maxRetries}]` : ''}`), prefixText: '', spinner: 'bouncingBar', interval: 120 }).start();
  isSpinnerActive = true;
  try {
    let config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
        'User-Agent': randomUseragent.getRandom(),
      },
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const payload = {
      address: aa_address,
      service_id,
      input: [{ type: "text/plain", value: message }],
      output: [{ type: "text/plain", value: aiResponse }],
    };
    const response = await axios.post('https://neo.prod.gokite.ai/v2/submit_receipt', payload, config);
    const reportId = response.data.data.id;
    if (!reportId) throw new Error('Invalid response: report ID missing');
    spinner.succeed(chalk.green(` ┊ ✓ Report Submited: ID=${reportId}`));
    await sleep(500);
    return reportId;
  } catch (err) {
    if (retryCount < maxRetries - 1) {
      spinner.text = chalk.cyan(` ┊ → Submit Report [Retry ke-${retryCount + 1}/${maxRetries}]`);
      await sleep(5000);
      return submitReport(aa_address, service_id, message, aiResponse, access_token, proxy, retryCount + 1);
    }
    spinner.fail(chalk.red(` ┊ ✗ Gagal Submit Report: ${err.message}`));
    await sleep(500);
    throw err;
  } finally {
    spinner.stop();
    isSpinnerActive = false;
    await clearConsoleLine();
  }
}

async function getInference(reportId, access_token, proxy = null, retryCount = 0) {
  const maxRetries = 5;
  await clearConsoleLine();
  const spinner = ora({ text: chalk.cyan(` ┊ → Mengambil Tx Hash${retryCount > 0 ? ` [Retry ke-${retryCount}/${maxRetries}]` : ''}`), prefixText: '', spinner: 'bouncingBar', interval: 120 }).start();
  isSpinnerActive = true;
  try {
    let config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
        'User-Agent': randomUseragent.getRandom(),
      },
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const response = await axios.get(`https://neo.prod.gokite.ai/v1/inference?id=${reportId}`, config);
    const txHash = response.data.data.tx_hash;
    if (!txHash) {
      if (retryCount < maxRetries - 1) {
        spinner.text = chalk.cyan(` ┊ → Mengambil Tx Hash [Retry ke-${retryCount + 1}/${maxRetries}]`);
        await sleep(20000);
        return getInference(reportId, access_token, proxy, retryCount + 1);
      }
      throw new Error('tx_hash tidak ditemukan setelah semua retry');
    }
    spinner.succeed(chalk.green(` ┊ ✓ Tx hash diterima: ${txHash}`));
    await sleep(500);
    return txHash;
  } catch (err) {
    if (retryCount < maxRetries - 1) {
      spinner.text = chalk.cyan(` ┊ → Mengambil Tx Hash [Retry ke-${retryCount + 1}/${maxRetries}]`);
      await sleep(20000);
      return getInference(reportId, access_token, proxy, retryCount + 1);
    }
    spinner.fail(chalk.red(` ┊ ✗ Gagal mengambil Tx Hash: ${err.message}`));
    await sleep(500);
    throw err;
  } finally {
    spinner.stop();
    isSpinnerActive = false;
    await clearConsoleLine();
  }
}

async function getWalletInfo(access_token, proxy = null, retryCount = 0) {
  const maxRetries = 5;
  await clearConsoleLine();
  const spinner = ora({ text: chalk.cyan(` ┊ → Mengambil info wallet${retryCount > 0 ? ` [Retry ke-${retryCount}/${maxRetries}]` : ''}`), prefixText: '', spinner: 'bouncingBar', interval: 120 }).start();
  isSpinnerActive = true;
  try {
    let config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
        'User-Agent': randomUseragent.getRandom(),
      },
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const response = await axios.get('https://ozone-point-system.prod.gokite.ai/leaderboard/me', config);
    const { username, rank, totalXpPoints } = response.data.data;
    if (!username || rank === undefined || totalXpPoints === undefined) {
      throw new Error('Invalid response: username, rank, or totalXpPoints missing');
    }
    spinner.succeed(chalk.green(` ┊ ✓ Info wallet diterima: ${username.slice(0, 8)}...`));
    await sleep(500);
    return { username, rank, totalXpPoints };
  } catch (err) {
    if (retryCount < maxRetries - 1) {
      spinner.text = chalk.cyan(` ┊ → Mengambil info wallet [Retry ke-${retryCount + 1}/${maxRetries}]`);
      await sleep(5000);
      return getWalletInfo(access_token, proxy, retryCount + 1);
    }
    spinner.fail(chalk.red(` ┊ ✗ Gagal mengambil info wallet: ${err.message}`));
    await sleep(500);
    throw err;
  } finally {
    spinner.stop();
    isSpinnerActive = false;
    await clearConsoleLine();
  }
}

async function createQuiz(eoa, access_token, proxy = null, retryCount = 0) {
  const maxRetries = 5;
  await clearConsoleLine();
  const spinner = ora({ text: chalk.cyan(` ┊ → Membuat daily quiz${retryCount > 0 ? ` [Retry ke-${retryCount}/${maxRetries}]` : ''}`), prefixText: '', spinner: 'bouncingBar', interval: 120 }).start();
  isSpinnerActive = true;
  try {
    let config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
        'User-Agent': randomUseragent.getRandom(),
      },
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const today = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
    const payload = {
      title: `daily_quiz_${today}`,
      num: 1,
      eoa,
    };
    const response = await axios.post('https://neo.prod.gokite.ai/v2/quiz/create', payload, config);
    const quiz_id = response.data.data.quiz_id;
    if (!quiz_id) throw new Error('Invalid response: quiz_id missing');
    spinner.succeed(chalk.green(` ┊ ✓ Quiz Created : quiz_id=${quiz_id}`));
    await sleep(500);
    return quiz_id;
  } catch (err) {
    if (retryCount < maxRetries - 1) {
      spinner.text = chalk.cyan(` ┊ → Membuat daily quiz [Retry ke-${retryCount + 1}/${maxRetries}]`);
      await sleep(5000);
      return createQuiz(eoa, access_token, proxy, retryCount + 1);
    }
    spinner.fail(chalk.red(` ┊ ✗ Gagal membuat daily quiz: ${err.message}`));
    await sleep(500);
    throw err;
  } finally {
    spinner.stop();
    isSpinnerActive = false;
    await clearConsoleLine();
  }
}

async function getQuiz(quiz_id, eoa, access_token, proxy = null, retryCount = 0) {
  const maxRetries = 5;
  await clearConsoleLine();
  const spinner = ora({ text: chalk.cyan(` ┊ → Mengambil jawaban quiz${retryCount > 0 ? ` [Retry ke-${retryCount}/${maxRetries}]` : ''}`), prefixText: '', spinner: 'bouncingBar', interval: 120 }).start();
  isSpinnerActive = true;
  try {
    let config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
        'User-Agent': randomUseragent.getRandom(),
      },
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const response = await axios.get(`https://neo.prod.gokite.ai/v2/quiz/get?id=${quiz_id}&eoa=${eoa}`, config);
    const quizData = response.data.data;
    if (!quizData.quiz || !quizData.question || quizData.question.length === 0) {
      throw new Error('Invalid response: quiz or question data missing');
    }
    const question = quizData.question[0];
    const quizDetails = {
      quiz_id: quizData.quiz.quiz_id,
      question_id: question.question_id,
      content: question.content,
      answer: question.answer,
    };
    spinner.succeed(chalk.green(` ┊ ✓ Answer Received: ${question.answer}`));
    await sleep(500);
    console.log(chalk.grey(` ┊ │   ╰┈➤  Question: ${question.content}`));
    return quizDetails;
  } catch (err) {
    if (retryCount < maxRetries - 1) {
      spinner.text = chalk.cyan(` ┊ → Mengambil jawaban quiz [Retry ke-${retryCount + 1}/${maxRetries}]`);
      await sleep(5000);
      return getQuiz(quiz_id, eoa, access_token, proxy, retryCount + 1);
    }
    spinner.fail(chalk.red(` ┊ ✗ Gagal mengambil jawaban quiz: ${err.message}`));
    await sleep(500);
    throw err;
  } finally {
    spinner.stop();
    isSpinnerActive = false;
    await clearConsoleLine();
  }
}

async function submitQuiz(quiz_id, question_id, answer, eoa, access_token, proxy = null, retryCount = 0) {
  const maxRetries = 5;
  await clearConsoleLine();
  const spinner = ora({ text: chalk.cyan(` ┊ → Mengirim jawaban quiz${retryCount > 0 ? ` [Retry ke-${retryCount}/${maxRetries}]` : ''}`), prefixText: '', spinner: 'bouncingBar', interval: 120 }).start();
  isSpinnerActive = true;
  try {
    let config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
        'User-Agent': randomUseragent.getRandom(),
      },
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const payload = {
      quiz_id,
      question_id,
      answer,
      finish: true,
      eoa,
    };
    const response = await axios.post('https://neo.prod.gokite.ai/v2/quiz/submit', payload, config);
    const result = response.data.data.result;
    if (!result) throw new Error('Invalid response: result missing');
    spinner.succeed(chalk.green(` ┊ ✓ Answer Correct , Daily Quiz Completed`));
    await sleep(500);
    return result;
  } catch (err) {
    if (retryCount < maxRetries - 1) {
      spinner.text = chalk.cyan(` ┊ → Mengirim jawaban quiz [Retry ke-${retryCount + 1}/${maxRetries}]`);
      await sleep(5000);
      return submitQuiz(quiz_id, question_id, answer, eoa, access_token, proxy, retryCount + 1);
    }
    spinner.fail(chalk.red(` ┊ ✗ Gagal mengirim jawaban quiz: ${err.message}`));
    await sleep(500);
    throw err;
  } finally {
    spinner.stop();
    isSpinnerActive = false;
    await clearConsoleLine();
  }
}

let transactionHashCache = [];
async function getRandomTransactionHash(proxy = null, retryCount = 0) {
  const maxRetries = 3;
  const RPC_URL = 'https://nodes.pancakeswap.info/';

  if (transactionHashCache.length > 0) {
    const randomIndex = crypto.randomInt(0, transactionHashCache.length);
    return transactionHashCache[randomIndex];
  }

  await clearConsoleLine();
  const spinner = ora({ text: chalk.cyan(` ┊ → Mengambil hash transaksi dari RPC${retryCount > 0 ? ` [Retry ke-${retryCount}/${maxRetries}]` : ''}...`), prefixText: '', spinner: 'bouncingBar', interval: 120 }).start();
  isSpinnerActive = true;
  try {
    let config = { headers: { 'Content-Type': 'application/json', 'User-Agent': randomUseragent.getRandom() } };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBlockByNumber',
      params: ['latest', true],
    };
    const response = await axios.post(RPC_URL, payload, config);
    const transactions = response.data.result.transactions;
    if (!transactions || transactions.length === 0) throw new Error('Tidak ada transaksi ditemukan di blok terbaru');
    transactionHashCache = transactions.map(tx => tx.hash).slice(0, 50);
    const randomIndex = crypto.randomInt(0, transactionHashCache.length);
    spinner.succeed(chalk.green(` ┊ ✓ Hash transaksi diterima`));
    await sleep(500);
    return transactionHashCache[randomIndex];
  } catch (err) {
    if (retryCount < maxRetries - 1) {
      spinner.text = chalk.cyan(` ┊ → Mengambil hash transaksi dari RPC [Retry ke-${retryCount + 1}/${maxRetries}]`);
      await sleep(5000);
      return getRandomTransactionHash(proxy, retryCount + 1);
    }
    spinner.fail(chalk.red(` ✗ Gagal mengambil hash transaksi: ${err.message}`));
    await sleep(500);
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  } finally {
    spinner.stop();
    isSpinnerActive = false;
    await clearConsoleLine();
  }
}

function selectAgent(agentNames, usedAgents) {
  const weights = agentNames.map(agent => {
    const count = usedAgents.filter(a => a === agent).length;
    return 1 / (1 + count);
  });
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = weights.map(w => w / totalWeight);
  let cumulative = 0;
  const cumulativeWeights = normalizedWeights.map(w => cumulative += w);
  const random = crypto.randomInt(0, 1000) / 1000;
  for (let i = 0; i < cumulativeWeights.length; i++) {
    if (random <= cumulativeWeights[i]) return agentNames[i];
  }
  return agentNames[agentNames.length - 1];
}

let lastCycleEndTime = null;

function startCountdown(nextRunTime) {
  const countdownInterval = setInterval(() => {
    if (isSpinnerActive) return;
    const now = moment();
    const timeLeft = moment.duration(nextRunTime.diff(now));
    if (timeLeft.asSeconds() <= 0) {
      clearInterval(countdownInterval);
      return;
    }
    clearConsoleLine();
    const hours = Math.floor(timeLeft.asHours()).toString().padStart(2, '0');
    const minutes = Math.floor(timeLeft.asMinutes() % 60).toString().padStart(2, '0');
    const seconds = Math.floor(timeLeft.asSeconds() % 60).toString().padStart(2, '0');
    process.stdout.write(chalk.cyan(` ┊ ⏳ Menunggu siklus berikutnya: ${hours}:${minutes}:${seconds}\r`));
  }, 1000);
}

async function processAccounts(accounts, professorMessages, cryptoBuddyMessages, accountProxies, chatCount, noType) {
  let successCount = 0;
  let failCount = 0;
  let successfulChats = 0;
  let failedChats = 0;

  const aiAgents = {
    "Professor": "deployment_KiMLvUiTydioiHm7PWZ12zJU",
    "Crypto Buddy": "deployment_ByVHjMD6eDb9AdekRIbyuz14",
    "Sherlock": "deployment_OX7sn2D0WvxGUGK8CTqsU5VJ"
  };
  const agentNames = ["Professor", "Crypto Buddy", "Sherlock"];

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const proxy = accountProxies[i];
    const shortAddress = `${account.address.slice(0, 8)}...${account.address.slice(-6)}`;
    const usedAgents = [];

    displayHeader(`═════[ Akun ${i + 1}/${accounts.length} | ${shortAddress} @ ${getTimestamp()} ]═════`, chalk.blue);
    console.log(chalk.cyan(` ┊ ${proxy ? `Menggunakan proxy: ${proxy}` : 'Tidak menggunakan proxy'}`));

    try {
      const { access_token, aa_address } = await authenticate(account.address, account.privateKey, proxy);
      const profile = await login(account.address, aa_address, access_token, proxy);

      console.log(chalk.magentaBright(' ┊ ┌── Proses Chat ──'));
      for (let j = 0; j < chatCount; j++) {
        console.log(chalk.yellow(` ┊ ├─ Chat ${createProgressBar(j + 1, chatCount)} ──`));
        const selectedAgent = selectAgent(agentNames, usedAgents);
        usedAgents.push(selectedAgent);
        const service_id = aiAgents[selectedAgent];
        let message;
        if (selectedAgent === "Sherlock") {
          const hash = await getRandomTransactionHash(proxy);
          message = `What do you think of this transaction? ${hash}`;
        } else if (selectedAgent === "Professor") {
          if (!professorMessages.length) throw new Error('Tidak ada pesan Professor yang tersedia');
          message = professorMessages[crypto.randomInt(0, professorMessages.length)].replace(/\r/g, '');
        } else {
          if (!cryptoBuddyMessages.length) throw new Error('Tidak ada pesan Crypto Buddy yang tersedia');
          message = cryptoBuddyMessages[crypto.randomInt(0, cryptoBuddyMessages.length)].replace(/\r/g, '');
        }
          console.log(`${chalk.white(' ┊ │ Using Agent [ ')}${chalk.green(selectedAgent)}${chalk.white(' ] - Message: ')}${chalk.yellow(message)}`);
        try {
          const response = await chatWithAI(access_token, service_id, message, proxy);
          await typeText(response, chalk.green, noType);
          const reportId = await submitReport(aa_address, service_id, message, response, access_token, proxy);
          await getInference(reportId, access_token, proxy);
          successfulChats++;
          console.log(chalk.yellow(' ┊ └──'));
        } catch (chatErr) {
          console.log(chalk.red(` ┊ ✗ Chat ${j + 1} gagal: ${chatErr.message}`));
          failedChats++;
          console.log(chalk.yellow(' ┊ └──'));
        }
        await sleep(8000);
      }
      console.log(chalk.yellow(' ┊ └──'));

      console.log(chalk.magentaBright(' ┊ ┌── Proses Daily Quiz ──'));
      try {
        const quiz_id = await createQuiz(account.address, access_token, proxy);
        const quizDetails = await getQuiz(quiz_id, account.address, access_token, proxy);
        await submitQuiz(quiz_id, quizDetails.question_id, quizDetails.answer, account.address, access_token, proxy);
      } catch (quizErr) {
        console.log(chalk.red(` ┊ ✗ Gagal menyelesaikan daily quiz: ${quizErr.message}`));
      }
      console.log(chalk.yellow(' ┊ └──'));

      try {
        const walletInfo = await getWalletInfo(access_token, proxy);
        const agentCounts = agentNames.reduce((counts, agent) => {
          counts[agent] = usedAgents.filter(a => a === agent).length;
          return counts;
        }, {});
        console.log(chalk.yellow(' ┊ ┌── User Information ──'));
        console.log(chalk.white(` ┊ │ Username: ${walletInfo.username.slice(0, 8)}...`));
        console.log(chalk.white(` ┊ │ Rank: ${walletInfo.rank}`));
        console.log(chalk.white(` ┊ │ Total XP Points: ${walletInfo.totalXpPoints}`));
        agentNames.forEach(agent => {
          console.log(chalk.white(` ┊ │ Agent ${agent}: ${agentCounts[agent] || 0}`));
        });
        console.log(chalk.yellow(' ┊ └──'));
      } catch (walletErr) {
        console.log(chalk.red(` ┊ ✗ Gagal mendapatkan info wallet: ${walletErr.message}`));
      }

      if (successfulChats > 0) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (err) {
      console.log(chalk.red(` ┊ ✗ Error: ${err.message}`));
      failCount++;
    }

    console.log(chalk.gray(' ┊ ══════════════════════════════════════'));
  }

  lastCycleEndTime = moment();
  displayHeader(`═════[ Selesai @ ${getTimestamp()} ]═════`, chalk.blue, false);
  console.log(chalk.gray(` ┊ ✅ ${successCount} akun sukses, ❌ ${failCount} akun gagal`));
  const nextRunTime = moment().add(24, 'hours');
  startCountdown(nextRunTime);
}

let isProcessing = false;

function scheduleNextRun(accounts, professorMessages, cryptoBuddyMessages, accountProxies, chatCount, noType) {
  const delay = 24 * 60 * 60 * 1000;
  console.log(chalk.cyan(` ┊ ⏰ Proses akan diulang setiap 24 jam...`));
  setInterval(async () => {
    if (isProcessing || isSpinnerActive) return;
    try {
      isProcessing = true;
      const nextRunTime = moment().add(24, 'hours');
      await processAccounts(accounts, professorMessages, cryptoBuddyMessages, accountProxies, chatCount, noType);
      startCountdown(nextRunTime);
    } catch (err) {
      console.log(chalk.red(` ✗ Error selama siklus: ${err.message}`));
    } finally {
      isProcessing = false;
    }
  }, delay);
}

async function main() {
  console.log('\n');
  displayBanner();
  const noType = process.argv.includes('--no-type');
  let accounts = [];
  try {
    const accountsData = await fs.readFile('accounts.txt', 'utf8');
    const lines = accountsData.split('\n').filter(line => line.trim() !== '');
    for (let i = 0; i < lines.length; i++) {
      const privateKey = lines[i].trim();
      if (!isValidPrivateKey(privateKey)) {
        console.log(chalk.red(`✗ privateKey pada baris ${i + 1} tidak valid: ${privateKey}. Harus berupa 64 karakter heksadesimal.`));
        rl.close();
        return;
      }
      const wallet = new ethers.Wallet(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`);
      accounts.push({ address: wallet.address, privateKey });
    }
  } catch (err) {
    console.log(chalk.red('✗ File accounts.txt tidak ditemukan atau kosong! Pastikan berisi privateKey per baris.'));
    rl.close();
    return;
  }

  if (accounts.length === 0) {
    console.log(chalk.red('✗ Tidak ada akun valid di accounts.txt!'));
    rl.close();
    return;
  }

  let professorMessages = [];
  let cryptoBuddyMessages = [];
  try {
    const professorMsgData = await fs.readFile('pesan_professor.txt', 'utf8');
    professorMessages = professorMsgData.split('\n').filter(line => line.trim() !== '').map(line => line.replace(/\r/g, ''));
    const cryptoBuddyMsgData = await fs.readFile('pesan_cryptobuddy.txt', 'utf8');
    cryptoBuddyMessages = cryptoBuddyMsgData.split('\n').filter(line => line.trim() !== '').map(line => line.replace(/\r/g, ''));
  } catch (err) {
    console.log(chalk.red('✗ File pesan_professor.txt atau pesan_cryptobuddy.txt tidak ditemukan atau kosong!'));
    rl.close();
    return;
  }

  if (professorMessages.length === 0) {
    console.log(chalk.red('✗ File pesan_professor.txt kosong!'));
    rl.close();
    return;
  }
  if (cryptoBuddyMessages.length === 0) {
    console.log(chalk.red('✗ File pesan_cryptobuddy.txt kosong!'));
    rl.close();
    return;
  }

  let chatCount;
  while (true) {
    const input = await promptUser('Masukkan jumlah chat per akun: ');
    chatCount = parseInt(input, 10);
    if (!isNaN(chatCount) && chatCount > 0) break;
    console.log(chalk.red('✗ Masukkan angka yang valid!'));
  }

  let useProxy;
  while (true) {
    const input = await promptUser('Gunakan proxy? (y/n) ');
    if (input.toLowerCase() === 'y' || input.toLowerCase() === 'n') {
      useProxy = input.toLowerCase() === 'y';
      break;
    }
    console.log(chalk.red('✗ Masukkan "y" atau "n"!'));
  }

  let proxies = [];
  if (useProxy) {
    try {
      const proxyData = await fs.readFile('proxy.txt', 'utf8');
      proxies = proxyData.split('\n').filter(line => line.trim() !== '');
      if (proxies.length === 0) {
        console.log(chalk.yellow('✗ File proxy.txt kosong. Lanjut tanpa proxy.'));
      }
    } catch (err) {
      console.log(chalk.yellow('✗ File proxy.txt tidak ditemukan. Lanjut tanpa proxy.'));
    }
  }

  const accountProxies = accounts.map((_, index) => proxies.length > 0 ? proxies[index % proxies.length] : null);

  console.log(chalk.cyan(` ┊ ⏰ Memulai proses untuk ${accounts.length} akun...`));
  await processAccounts(accounts, professorMessages, cryptoBuddyMessages, accountProxies, chatCount, noType);
  scheduleNextRun(accounts, professorMessages, cryptoBuddyMessages, accountProxies, chatCount, noType);
  rl.close();
}

main();
