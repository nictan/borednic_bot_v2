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
 \`/pvp <Token> <Direction ("L"/"S")> <#Tokens> <Risk$ Optional> \`
    
e.g. \`/pvp BTC l 21 $500 \`
    
     \`/pvp SOL s 21 $500 \`

-------------------------------
Here is how I calculate it:

<# Tokens> x <$ Price>    
------------------- = <Margin>
     <Leverage>`,
`*Alternatively ....*
  \`/pvp <Token> <Direction (l or s)> <$Amount> <Risk$ Optional> \`
    
e.g. \`/pvp SOL s $2100 $500 \`
*Where $2100 is the total amount of SOL you want to trade.*

----------------------------------
Here is how I calculate it:

<Total $Amt>
----------- = <Margin>
 <Leverage>`];
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

/* **************************************
 * This message is a template message 
 * for errors
 * **************************************/
export function msgError(errormessage) {
    return `*I've encountered some issue processing your request .....*
${errormessage}`;
}