import { replyTextandPhoto } from '../lib/common.js';
import { getAssetContextForSymbol } from '../lib/hyper.js';

/**
 * Registers /help and the two callback actions on the supplied bot.
 * Call this once from your main file.
 */
export async function registerInfoCommands(bot) {
    /* hyperinfo 
     * 
     * provides token info from hyperliquid.
     * provides the leverage and current price of the tokem.
     */
    bot.command('hypeinfo', async (ctx) =>{
        const args = ctx.message.text.split(' ').slice(1);
        const ticker = args[0];
        
        const token = await getAssetContextForSymbol(ticker);
    
        if (token.success) {
            console.log(token.data);
            const msg = [{type:"text", data:`Token: ${token.data.name}\nLeverage: ${token.data.leverage}\nPrice: ${token.data.price}`}];
            replyTextandPhoto(ctx, msg);
        }
    
        ctx.reply(token.error, { parse_mode: 'Markdown' });
    });

    /* info command
     *
     * Provides stock information using Yahoo Finance
     * 
     */
    bot.command('info', async (ctx) =>{
        //const chatObj = ctx.chat;
        const fromObj = ctx.from;
        const textMsg = ctx.text;

        const msg = await processStockRequest(fromObj, textMsg);

        replyTextandPhoto(ctx, msg);
    });
}

const urlStock = "https://my-notional.vercel.app/api";

async function processStockRequest(fromObj, textMsg) {
    const args = textMsg.split(' ').slice(1);
    const stock = args[0];

    console.log(stock);
    if (stock == ""){
        //error
        return {type:"text", data: `Please provide a stock symbol.`};
    }

    const url = `${urlStock}//getStockPrice?symbol=${stock}`;
    console.log(url);
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    });
    console.log(response);

    if (!response.ok) {
        return {type:"text", data: `HTTP Error: ${response.status}`};
    }

    const data = await response.json();
    console.log(data);
    return {type:"text", data: `Symbol:  ${data.symbol}
Name:     ${data.name}
Currency: ${data.currency}
Market price:  ${data.marketprice}
Market Date:  ${data.marketdate}
Market Time:  ${data.markettime}`};
}
