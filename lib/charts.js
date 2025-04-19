

/*
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
*/


