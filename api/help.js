// api/help.js
import { Markup } from 'telegraf';
import { msghelp, helpPeri, helpPvp } from '../lib/messages.js';

/**
 * Utility that sends an array‑or‑string with ctx.reply / ctx.replyWithPhoto
 */
async function replyTextandPhoto(ctx, content) {
  const items = Array.isArray(content) ? content : [content];
  for (const item of items) {
    if (item.type === 'image') {
      await ctx.replyWithPhoto(item.url);
    } else {
      await ctx.reply(item.data, { parse_mode: 'Markdown' });
    }
  }
}

/**
 * Registers /help and the two callback actions on the supplied bot.
 * Call this once from your main file.
 */
export function registerHelpCommands(bot) {
  // /help command
  bot.command('help', (ctx) =>
    ctx.reply(msghelp(), {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        Markup.button.callback('Help on Peri Command', 'peri_help'),
        Markup.button.callback('Help on Pvp Command',  'pvp_help')
      ])
    })
  );

  // inline‑button callbacks
  bot.action('peri_help',  (ctx) => replyTextandPhoto(ctx, helpPeri()));
  bot.action('pvp_help',   (ctx) => replyTextandPhoto(ctx, helpPvp()));
}
