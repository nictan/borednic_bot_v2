/* **************************************
 * This message is provided when the 
 * user perform a /start command
 * **************************************/
export function msgStart() {
    return `*Welcome to the KPO Helper Bot!*
  
I’m here to help you with quick calculations and essential data for your trades. Here’s what you can do:
    
Get recommended position sizing for a given trading pair, risk, and stop-loss for peri bot
Get recommended position sizing for a given trade margin to use for pvp.trade bot

If you need *any* help with syntax or usage, just type any command without arguments to see an example.
    
Happy trading!`;
}

/* **************************************
 * This message is provided when the
 * user didnt provide the sufficient
 * arguments for PVP command.
 * **************************************/
export function msgPvpSize() {
    return [`*Oh... pvp command is used as follows*
 \`/pvp <Token> <Direction: L / S> <Risk$> <SL Distance>\`
    
e.g. \`/pvp BTC l $500 1280\`
    
     \`/pvp SOL s $500 1.2S\``,
`Here is how I calculate

    <Risk$>
-------------
<SL Distance>

= <#Token> x <Current$>
= <$TotalAmt>`
];
}


// **************************************
// This message is provided when the 
// user perform a /perisize command but has error
// **************************************
export function msgPeriSize() {
    return [`*Oh... peri command is used as follows*`,
`\`/peri <pair> <direction <Risk$> <SL%> <TP Optional> <SL Optional>\`
    
e.g. \`/peri BTC/SOL L $500 21% 36.02 10.31\`

or you can don't provide the TP and SL with the following command.
    
e.g. \`/peri HYPE/AAVE S $100 10%\``,
`Here is how I calculate it:

<Risk$>
-------- x 2 = Trade Amount 
<SL%>           (Output)`];
}

/* msgError()
 * **************************************
 * This message is a template message 
 * for errors
 * **************************************/
export function msgError(errormessage) {
    return `*I've encountered some issue processing your request .....*
${errormessage}`;
}

/* help
 * *****************************
 * This is the message to display 
 * to users who have triggered 
 * help command.
 * *****************************/
export function msghelp(){
    return `<b>Help Section</b>
Click on the buttons below to get the areas you needed help on.`;
}

/* helpPeri
 * *****************************
 * This is the message to help 
 * someone using the peri 
 * command on what the bot 
 * expects.
 * *****************************/
export function helpPeri() {
    const base_url = process.env.URL_LOCAL;
    const msg_ = [
        {type:"text", data:`The /Peri command helps bridge the gap from chart to executing in peri bot.`},
        {type:"text", data:`*Note:*\nPlease take the values from TradingView\n
_SL_: is a value lowest value referencing the red box for Long (See right end of the chart for the value); highest value referencing the red box for short.
_TP_: is a value highest value referencing the green box for Long (See right end of the chart for the value); lowest value referencing the green box for short.
_SL %_: within the red box the % is provided for SL.
_risk_: in the event the trade as expected this is the amount you're looking to lose.`},
        {type:"image", url:`https://borednic-bot.vercel.app/PeriBotImg.png`}
    ];
    return msg_;
}


export function helpPvp() {
    const base_url = process.env.URL_LOCAL;
    const msg_ = [
        {type:"text", data:`The /pvp command helps bridge the gap from chart to executing in pvp bot.`},
        {type:"text", data:`*Note:*\nPlease take the values from TradingView\n
_token_: such as btc, sol, etc...
_direction_: the direction are you planning to trade.
_stop loss level_: is a value lowest value referencing the red box for Long (See right end of the chart for the value); highest value referencing the red box for short.
_risk amount_: in the event the trade as expected this is the amount you're looking to lose.`},
        {type:"image", url: "https://borednic-bot.vercel.app/PvpBotImg.png"}];
    return msg_;
}
        