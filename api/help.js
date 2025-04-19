// api/help.js
import { Markup } from 'telegraf';
import { helpPeri, helpPvp } from '../lib/messages.js';
import { replyTextandPhoto } from '../lib/common.js';

/**
 * Registers /help and the two callback actions on the supplied bot.
 * Call this once from your main file.
 */
export function registerHelpCommands(bot) {
  // /help command
  bot.command('help', (ctx) =>
    ctx.reply(msghelp(), {
      parse_mode: 'Markdown',
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

/* help
 * *****************************
 * This is the message to display 
 * to users who have triggered 
 * help command.
 * *****************************/
export function msghelp () {
  return (
`*🤖 KPO Helper — command reference*\n\n` +      // bold title
'*Command: start*\nWelcome & register\n\`/start\`\n\n' +
'*Command: pvp <TOKEN> <L|S> <RISK$> <SLdist>*\nPvP.Trade size & margin i.e. /pvp BTC L $500 1280\n\n' +
'*Command: peri <BASE/QUOTE> <L|S> <RISK$> <SL%> <TP> <SL> [HL A/C]*\n\n' +
'*Command: perisimple <BASE/QUOTE> <L|S> <RISK$> <SL%> [HL A/C]*\n' +
'Peri Bot position size i.e. /perisimple BTC/SOL S $300 1.8%\n\n' +
'*Command: perp*\nGetting your Hyperliquid margin summary i.e. /perp 0xABCD…1234\n\n' +
'*Command: info <TICKER>*\nSpot price via price API i.e. /info ETH\n\n' +
'*Command: setting*\nopen settings menu, save your Chart‑Img key / HL account\n\n'+
'\n\nAdditional help available on the options below.'
  );
}