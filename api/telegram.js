// api/telegram.js
import { Telegraf } from 'telegraf';
import { startRegisterUser, activityLogging } from '../lib/airtable.js';
import { msgStart, msgPvpSize, msgPeriSize, msgPeriSimpleSize } from '../lib/messages.js';
import { periCalcSimple, periCalc2, pvpCalc, pvpInputs } from '../lib/risk.js';
//import { fetchChartPng } from '../lib/chartimg.js';
//import { fetchPriceInfo } from '../lib/info.js';
import { getUserPerpMargin } from '../lib/hyper.js';
import { replyTextandPhoto } from '../lib/common.js';

// 1️⃣  Create bot instance
const bot = new Telegraf(process.env.TELEGRAM_TOKEN, {
  telegram: { webhookReply: true }      // important for Vercel
});
// ─────────────── COMMANDS ───────────────

// /start command ~
bot.start(async ctx => {
  if (ctx.chat) {
    const chatObj = ctx.chat;
    const fromObj = ctx.from;
    //const textMsg = ctx.text;

    await startRegisterUser(chatObj, fromObj);
  }
  await replyTextandPhoto(ctx, msgStart());
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
  //const chatObj = ctx.chat;
  //const fromObj = ctx.from;
  //const textMsg = ctx.text;
  const args = ctx.message.text.split(' ').slice(1);
    
  if (args.length < 4 || args.length > 4) {
    // If invalid, return usage instructions from msgPeriSize
    await replyTextandPhoto(ctx, msgPvpSize());
  } else {
    const token = args[0];
    const direction = args[1];
    const riskAmount = args[2];
    const stopLossDist = args[3];

    const reply1 = await pvpInputs(token, direction, riskAmount, stopLossDist);
    await replyTextandPhoto(ctx, reply1);

    const reply2 = await pvpCalc(token, direction, riskAmount, stopLossDist);
    await replyTextandPhoto(ctx, reply2);
  }
});

// /peri <pair> <direction> <risk$> <SL%> [TP] [SL]
bot.command('peri', async ctx => {
  const chatObj = ctx.chat;
  const fromObj = ctx.from;
  const textMsg = ctx.text;
  const args = ctx.message.text.split(' ').slice(1);

  if (args.length < 6 || args.length > 7) {
    // If invalid, return usage instructions from msgPeriSize
    await replyTextandPhoto(ctx, msgPeriSize());
  } else {
    const reply = await periCalc2(fromObj, textMsg);
    await replyTextandPhoto(ctx, reply);
  }
});

// /peris <pair> <direction> <risk$> <SL%>
bot.command('perisimple', async ctx => {
  //const chatObj = ctx.chat;
  const fromObj = ctx.from;
  const textMsg = ctx.text;
  const args = ctx.message.text.split(' ').slice(1);

  if (args.length < 4 || args.length > 4) {
    // If invalid, return usage instructions from msgPeriSize
    await replyTextandPhoto(ctx, msgPeriSimpleSize());
  } else {
    const reply = await periCalcSimple(fromObj, textMsg);
    await replyTextandPhoto(ctx, reply);
  }
});

bot.command('perp', async ctx => {
  const args = ctx.message.text.split(' ').slice(1);
  const accountId = args[0];
  const perps = await getUserPerpMargin(accountId);
  if(perps) {
    const msg = [{type:"text",data:`\`Account Value:\` ${perps.universe.accountValue}
\`Total Positions:\`${perps.universe.totalNtlPos}
\`Total Margin Used:\` ${perps.universe.totalMarginUsed}`}];
    await replyTextandPhoto(ctx, msg);
  } else {
    ctx.reply(`Account not found in HyperLiquid.`);
  }
});

// import and register help menu
import { registerHelpCommands } from './help.js';
registerHelpCommands(bot);

// import and register info menu
import { registerInfoCommands } from './info.js';
registerInfoCommands(bot);

// import and register settings menu
import { registerSettingMenu } from './setting.js';
registerSettingMenu(bot);


// ─────────────── Vercel handler ───────────────
export default async function handler(req, res) {
  try {    
    if (req.body.message) {
      await activityLogging(req.body);
    } else {
      // console.log(req.body);
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

export { bot };          // <= make the singleton available to other modules