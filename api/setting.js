// api/setting.js
import { Markup } from 'telegraf';
import { saveChartKey } from '../lib/airtable.js';

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
        [Markup.button.callback('Set Chart‑Img API key', 'set_chart_key')],
      ]),
    })
  );

  // user tapped the inline button
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
      const chatId = ctx.chat.id;
      const rawKey = ctx.message.text.trim();
      console.log("Replied with intended message to update chart-img key.");

      // quick validation
      if (rawKey.length < 20 || /\s/.test(rawKey)) {
        return ctx.reply('❌ That doesn’t look like a valid key. Try again.');
      }

      try {
        await saveChartKey(chatId, rawKey);
        const masked = rawKey.slice(-4).padStart(rawKey.length, '•');
        await ctx.reply(
          `✅ Key saved!\nNow you can run commands to retrieve charts`,
          { parse_mode: 'Markdown' }
        );
        await ctx.reply(`(stored as ${masked})`);
      } catch (err) {
        await ctx.reply(`❌ Could not save key: ${err.message}`);
      }
    } else {
      // not a reply to our prompt → let other handlers process
      return next();
    }
  });
}
