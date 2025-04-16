// api/setting.js
import { Markup } from 'telegraf';
import { saveChartKey, getMyChartKey, getHypeAcc, saveHypeAcc } from '../lib/airtable.js';

// simple in‑memory map: chatId → waitingForKey (boolean)
const awaitingKey = new Map();

/**
 * Register /setting flow on the supplied bot
 */
export function registerSettingMenu(bot) {
  // /setting command: show menu
  bot.command('setting', (ctx) =>
    ctx.reply('⚙️ Settings', {
      ...Markup.inlineKeyboard([
        [Markup.button.callback('Set Chart‑Img Key', 'set_chart_key')],
        [Markup.button.callback('Get Chart‑Img Key', 'get_chart_key')],
        [Markup.button.callback('Save Hyperliquid Acc Num', 'set_HL')],
        [Markup.button.callback('Get Hyperliquid Acc Num', 'get_HL')],
      ]),
    })
  );

  // user tapped the inline button
  bot.action('get_HL', async (ctx) => {
    const result = await getHypeAcc(ctx.from);
    if (result.status) {
      await ctx.reply(`Your HL Account number is: ${result.data}`);
    } else {
      await ctx.reply(`${result.error}`);
    }
  });

  bot.action('set_HL', async (ctx) => {
    await ctx.reply('This only saves your Hyperliquid Account number, this is to allow me to retrieve your perps data for calculation.');
    await ctx.reply(`I'm not a trading bot, I do not need API keys.`);
    awaitingKey.set(ctx.chat.id, true);              // mark state
    await ctx.answerCbQuery();
    await ctx.reply('Reply with your Hyperliquid Account Number (e.g. 0x123jh... )',
        Markup.forceReply());  // Telegram will show “reply” UI)
  });  

  bot.action('get_chart_key', async (ctx) => {
    const result = await getMyChartKey(ctx.from);
    if (result.status) {
      await ctx.reply(`Your API key saved is: ${result.data}`);
    } else {
      await ctx.reply(`${result.error}`);
    }
  });

  bot.action('set_chart_key', async (ctx) => {
    await ctx.reply('Please provide the chart-img API key');
    await ctx.reply('You can obtain one for free at https://chart-img.com/');
    awaitingKey.set(ctx.chat.id, true);              // mark state
    await ctx.answerCbQuery();
    await ctx.reply('Reply with your Chart‑Img API key (e.g. tfbwhjl…)',
        Markup.forceReply());  // Telegram will show “reply” UI)
  });

  // every text message – look if it’s replying to our force‑reply prompt
  bot.on('text', async (ctx, next) => {
    const replyTo = ctx.message.reply_to_message;
    console.log("Running inline message reply (Setting.js)");
    if (
      replyTo &&
      replyTo.text &&
      replyTo.text.startsWith('Reply with your Chart‑Img API key')
    ) {
      const textInput = ctx.message.text.trim();
      console.log("Replied with intended message to update chart-img key.");

      // quick validation
      if (textInput.length < 20 || /\s/.test(textInput)) {
        return ctx.reply('❌ That doesn’t look like a valid key. Try again.');
      }

      try {
        await saveChartKey(ctx.chat, ctx.from, textInput);
        const masked = textInput.slice(-4).padStart(textInput.length, '•');
        await ctx.reply(
          `✅ Key saved!\nNow you can run commands to retrieve charts`,
          { parse_mode: 'Markdown' }
        );
        await ctx.reply(`(stored as ${masked})`);
      } catch (err) {
        await ctx.reply(`❌ Could not save key: ${err.message}`);
      }
    } else if (
      replyTo &&
      replyTo.text &&
      replyTo.text.startsWith('Reply with your Hyperliquid Account Number')
    ){
      const textInput = ctx.message.text.trim();
      console.log("Replied with intended message to update Hyperliquid Account Number.");

      try {
        await saveHypeAcc(ctx.chat, ctx.from, textInput);
        const masked = textInput.slice(-6).padStart(textInput.length, '•');
        await ctx.reply(
          `✅ Account number saved!`,
          { parse_mode: 'Markdown' }
        );
        await ctx.reply(`(stored as ${masked})`);
      } catch (err) {
        await ctx.reply(`❌ Could not save account number: ${err.message}`);
      }
    } else {
      // not a reply to our prompt → let other handlers process
      return next();
    }
  });
}
