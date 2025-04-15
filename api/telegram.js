// api/telegram.js
import { Telegraf, Markup } from 'telegraf';
import { addUpdateUser, logActivity } from '../lib/airtable.js';
import { msgStart, msgPvpSize, msgPeriSize } from '../lib/messages.js';
import { pvpCalc, periCalc } from '../lib/risk.js';
//import { fetchChartPng } from '../lib/chartimg.js';
//import { fetchPriceInfo } from '../lib/info.js';
//import { hypePrice } from '../lib/hyper.js';

// 1️⃣  Create bot instance
const bot = new Telegraf(process.env.TELEGRAM_TOKEN, {
  telegram: { webhookReply: true }      // important for Vercel
});

// ─────────────── COMMANDS ───────────────

// /start
bot.start(async ctx => {
    //const eChatId = ctx.chat.id;
    //const eUsername = ctx.chat.username;
    //await addUpdateUser(eChatId, eUsername); // store chatId for broadcasts

    await ctx.reply(msgStart(), { parse_mode: 'Markdown' });
});

/* /pvp command
 * 
 * This handler computes and returns recommended position sizes for the `/pvp`
 * command. The user provides a trading pair, risk amount, and stop-loss (SL),
 * optionally including target profit (TP) or other arguments.
 *
 * Expected usage: `/pvp_pair <long pair>/<short pair> <Long/Short> <Total$Size>`
 *
 * Steps:
 * 1. Validate the argument count.
 * 2. Split the pair into base and quote.
 * 3. Fetch the leverage from Hyperliquid’s perps data.
 * 4. Convert the risk and SL from strings (with `$` or `%`) to numbers.
 * 5. Calculate position size with `(riskVal / (slVal / 100)) * 2`.
 * 6. Return a structured message from msgPeriSizeSuccessful.
 *
 * @param {string[]} args
 *   - args[0] => trading pair (e.g. "BTC/SOL")
 *   - args[1] => Total Amount of the Sizing including Max leverage
 * @returns {Object[]|string} A formatted success or usage message.
 */
bot.command('pvp', async ctx => {
  const args = ctx.message.text.split(' ').slice(1);
    
  if (args.length < 4 || args.length > 4) {
    // If invalid, return usage instructions from msgPeriSize
    await replyMany(ctx, msgPvpSize());
  } else {
    const reply = await pvpCalc(args);    // returns string on success / error
    await replyMany(ctx, reply);
  }
});

// /peri <pair> <risk$> <SL%> [TP] [SL]
bot.command('peri', async ctx => {
  const args = ctx.message.text.split(' ').slice(1);

  if (args.length < 4 || args.length > 6) {
    // If invalid, return usage instructions from msgPeriSize
    await replyMany(ctx, msgPeriSize());
  } else {
    const reply = await periCalc(args);
    await replyMany(ctx, reply);
  }
});

/*
// /setchartkey <YOUR_CHART_IMG_KEY>
// Saves user‑specific key in Airtable.
//
bot.command('setchartkey', async ctx => {
  const key = ctx.message.text.split(' ')[1];
  if (!key) return ctx.reply('Usage: /setchartkey <key>');
  await saveChartKey(ctx.chat.id, key);
  ctx.reply('✅ Chart‑img key saved!');
});


// /chart <SYMBOL> <INTERVAL>
// Uses the caller’s stored key.
//
bot.command('chart', async ctx => {
  const [, symbol = 'BINANCE:BTCUSDT', interval = '15m'] =
        ctx.message.text.split(' ');
  const user = await getUser(ctx.chat.id);
  if (!user?.chartKey)
    return ctx.reply('Please set your key first with /setchartkey <key>');
  try {
    const png = await fetchChartPng(user.chartKey, symbol, interval);
    await ctx.replyWithPhoto({ source: png },
      { caption: `${symbol} ${interval}` });
  } catch (e) {
    ctx.reply(`Chart error: ${e.message}`);
  }
});


// /info  <ticker>
bot.command('info', async ctx => {
  const ticker = ctx.message.text.split(' ')[1] || 'BTC';
  const out = await fetchPriceInfo(ticker);
  ctx.reply(out, { parse_mode: 'Markdown' });
});

// /hype_info <symbol>
bot.command('hype_info', async ctx => {
  const sym = ctx.message.text.split(' ')[1] || 'BTC';
  const out = await hypePrice(sym);
  ctx.reply(out, { parse_mode: 'Markdown' });
});
*/


// Help Section
import { msghelp, helpPeri } from '../lib/messages.js';

bot.command('help', ctx => {
  return ctx.reply(msghelp(), {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      Markup.button.callback('Help on Peri Command', 'peri_help'),
      //Markup.button.callback('Help on Pvp Command', 'pvp help')
    ])
  })
});

bot.action('peri_help', async ctx => {
  await replyTextandPhoto(ctx, helpPeri());
});


// ─────────────── Vercel handler ───────────────
export default async function handler(req, res) {
  try {
    const teleObj = req.body;
    if (req.body.message) {
      const eChatId = req.body.message.from.id;
      const eUsername = req.body.message.from.username;
      const eMessage = req.body.message.text;
      console.log(`Recieved a message from ID: ${eChatId} ,username: ${eUsername}`);
      console.log(`Text: ${eMessage}`);
    } else {
      console.log(teleObj);
    }

    if (process.env.ACTIVITY_LOG == "TRUE") {
      await logActivity(eChatId, eMessage);
    }

    await bot.handleUpdate(req.body, res);
  } finally {
    if (!res.writableEnded) res.end();  // Vercel must end response
  }
}

// helper – always treat result as an array, then await each reply
async function replyMany(ctx, content) {
  const lines = Array.isArray(content) ? content : [content];
  //console.log(lines);
  for (const line of lines) {
    await ctx.reply(line, { parse_mode: 'Markdown' });
  }
}

/*
items = 
[
  { type: text
    data: "messages" },
  { type: image
    url: "http://some.png" }
]
 */
async function replyTextandPhoto(ctx, content) {
  const items = Array.isArray(content) ? content : [content];
  //console.log(lines);
  for (const item of items) {
    if (item.type == "image") {
      await ctx.replyWithPhoto( item.url );
    } else {
      await ctx.reply(item.data, { parse_mode: 'Markdown' });
    }
  }
}
