// lib/messages.js
import { msgError, msgPeriSize, msgPeriResult } from '../lib/messages.js';
import { getAssetContextForSymbol, getPerpsByName, getUserPerpMargin } from '../lib/hyper.js';
import { getHypeAcc } from '../lib/airtable.js';

export async function pvpInputs(token, direction, riskAmount, stopLossDist) {
  if (direction.toUpperCase() !== "L" && direction.toUpperCase() !== "S") {
    return msgError("Please give L or S for direction input.");
  }

  const directions = direction.toUpperCase() === "L" ? "Long" : "Short";

  const msg = [
    { type:"text", data:`I'm processing your request, here are what you've given me.
\`Trading Coin:\` ${token.toUpperCase()}
\`Direction:\`        ${directions}
\`Risk Amount:\`    ${riskAmount}
\`Stoploss Distance:\` ${stopLossDist}` }
  ];
  return msg;
}

export async function pvpCalc(token, direction, riskAmount, stopLossDist) {

  // 2) Check direction
  if (direction.toUpperCase() !== "L" && direction.toUpperCase() !== "S") {
    return msgError("Please give L or S for direction input.");
  }

  // 3) Fetch token data
  const tokenData = await getAssetContextForSymbol(token);
  const riskAmountParsed = parseNumber(riskAmount);
  const stopLossDistParsed = parseNumber(stopLossDist);

  // 4) If success, compute totalAmount differently based on whether user typed '$'
  if (tokenData.success) {
    const directions = direction.toUpperCase() === "L" ? "Long" : "Short";
    const currentTokenPrice = tokenData.data.price;
    const tokenLeveraged = tokenData.data.leverage;
    
    const numTokens = roundUp(riskAmountParsed / stopLossDistParsed)
    const totalAmt = roundUp(numTokens * currentTokenPrice);
    const marginUsed = totalAmt/tokenLeveraged;


    const msg = [
      { type:"text", data:`*Recommended Pvp Command:*` },
      { type:"text", data:`\`/${directions} ${token} ${tokenLeveraged}x ${d2(marginUsed)}\`` },
      { type:"text", data:`*DIRECTION DETAILS*
  
\`Trading Coin:\`    ${token.toUpperCase()}
\`Current Price:\`  ${d2(currentTokenPrice)}
\`Leverage:\`             ${tokenLeveraged}x
\`Direction:\`           ${directions}
\`Total Amount:\`    ${d2(totalAmt)}
\`Risk Amount:\`      ${d2(riskAmountParsed)}
\`Tokens to purchase:\`  ${numTokens}
\`Margin Used:\`      ${d2(marginUsed)}`}
    ];
    return msg;
  } else {
    return msgError("Unable to find the token you're trying to trade.");
  }
}

export async function periCalcSimple(args) {
  const pairStr = args[0];
  const direction = args[1];
  const riskStr = args[2];
  const slpStr = args[3];

  // 1) Check direction
  if (direction.toUpperCase() !== "L" && direction.toUpperCase() !== "S") {
    return msgError("Please give L or S for direction input.");
  }
  
  // 2) Split pair into base and quote
  const [base, quote] = pairStr.split("/");
  //console.log(`Base: ${base}, Quote:${quote}`);

  // 3) Fetch perp data for base & quote
  const perpsData = await getPerpsByName([base, quote]);
  
  //console.log(perpsData);
  // 4) Calculate highest max leverage among matched perps
  const leverage = Math.max(...perpsData.universe.map(item => item.maxLeverage));

  // 5) Parse risk & SL
  // Convert risk and sl to numbers (stripping out $ or %)
  const riskVal = parseNumber(riskStr); 
  const slVal   = parseNumber(slpStr);

  if (isNaN(riskVal) || isNaN(slVal) || slVal === 0) {
    const msg = msgPeriSize();
    msg.push(msgError(`Invalid arguments. Please ensure your risk and SL are numbers (with or without '%' / '$').`))
    return msg;
  }

  // 6) Calculate position size
  const positionSize = (riskVal / (slVal / 100)) * 2;
  const roundedPositionSize = positionSize.toFixed(0);

  // 7) Calcuate potential margin used
  const half_size = roundedPositionSize/2;
  const detailed_base = perpsData.universe[0].name;
  const detailed_base_leverage = perpsData.universe[0].maxLeverage;
  const detailed_base_marginused = half_size/detailed_base_leverage;
  const detailed_quote = perpsData.universe[1].name;
  const detailed_quote_leverage = perpsData.universe[1].maxLeverage;
  const detailed_quote_marginused = half_size/detailed_quote_leverage;

  // 7) Return a success message object (array of objects) from messages.js
  let direction_text = direction.toUpperCase() == "L"?"long":"short";
  const msg = msgPeriResult(detailed_base, detailed_quote, direction_text, roundedPositionSize, leverage, d2(riskVal), slVal, detailed_base_leverage, d2(detailed_base_marginused), detailed_quote_leverage, d2(detailed_quote_marginused));
  //console.log(msg);
  return msg;
}

export async function periCalc2(fromObj, textMsg) {
  const args = textMsg.split(' ').slice(1);

  const pairStr = args[0];
  const direction = args[1];
  const riskStr = args[2];
  const slpStr = args[3];
  const tpStr = args[4]; // If undefined, becomes "<tp>"
  const slStr = args[5]; // If undefined, becomes "<sl>"
  const HLacc = args[6] || "";

  // 1) Check direction
  if (direction.toUpperCase() !== "L" && direction.toUpperCase() !== "S") {
    return msgError("Please give L or S for direction input.");
  }
  
  // 2) Split pair into base and quote
  const [base, quote] = pairStr.split("/");
  //console.log(`Base: ${base}, Quote:${quote}`);

  // 3) Fetch perp data for base & quote
  const perpsData = await getPerpsByName([base, quote]);
  
  //console.log(perpsData);
  // 4) Calculate highest max leverage among matched perps
  const leverage = Math.max(...perpsData.universe.map(item => item.maxLeverage));

  // 5) Parse risk & SL
  // Convert risk and sl to numbers (stripping out $ or %)
  const riskVal = parseNumber(riskStr); 
  const slVal   = parseNumber(slpStr);

  if (isNaN(riskVal) || isNaN(slVal) || slVal === 0) {
    const msg = msgPeriSize();
    msg.push(msgError(`Invalid arguments. Please ensure your risk and SL are numbers (with or without '%' / '$').`))
    return msg;
  }

  // 6) Calculate position size
  const positionSize = (riskVal / (slVal / 100)) * 2;
  const roundedPositionSize = positionSize.toFixed(0);

  // 7) Calcuate potential margin used
  const half_size = roundedPositionSize/2;
  const detailed_base = perpsData.universe[0].name;
  const detailed_base_leverage = perpsData.universe[0].maxLeverage;
  const detailed_base_marginused = half_size/detailed_base_leverage;
  const detailed_quote = perpsData.universe[1].name;
  const detailed_quote_leverage = perpsData.universe[1].maxLeverage;
  const detailed_quote_marginused = half_size/detailed_quote_leverage;

  // 7) Return a success message object (array of objects) from messages.js
  let direction_text = direction.toUpperCase() == "L"?"long":"short";
  var msg =  msgPeriResult(detailed_base, detailed_quote, direction_text, roundedPositionSize, leverage, d2(riskVal), slVal, detailed_base_leverage, d2(detailed_base_marginused), detailed_quote_leverage, d2(detailed_quote_marginused), n3(tpStr), n3(slStr));
/*  var msg = [`*Recommended Peri Command:*`,
`\`/market ${direction_text} ${base}/${quote} ${roundedPositionSize} ${leverage}x }\``, 
`-----------------------------------
*Pair DETAILS*

\`Trading Pair:\`  ${base.toUpperCase()}/${quote.toUpperCase()}
\`Risk Amount:\`    ${d2(riskVal)}
\`Take profit:\`    ${n3(tpStr)}
\`Stop Loss:\`        ${n3(slStr)}
\`Stop Loss %:\`    ${slVal}%
*Recommended Position Size (Total):* $ \`${roundedPositionSize}\`

_Stay disciplined and manage your risk!_`,
`*${detailed_base} Details:*
\`Leverage:\`              ${detailed_base_leverage}x
\`Position Size:\`  ${d2(half_size)}
\`Margin Used:\`       ${d2(detailed_base_marginused)}`,
`*${detailed_quote} Details:*
\`Leverage:\`              ${detailed_quote_leverage}x
\`Position Size:\`  ${d2(half_size)}
\`Margin Used:\`       ${d2(detailed_quote_marginused)}`];*/

   // 8) Calculate if your account has sufficient margin.
    if (HLacc == "") {
      console.log("No A/c provided");
      const tempInfo = await getHypeAcc(fromObj);
      if (tempInfo.status) {
        console.log("has a/c saved");
        const msg2 = await performHLMarginChecks(tempInfo.data, detailed_quote_marginused, detailed_base_marginused);
        msg.push(msg2);
      }
    } else {
      console.log("A/c provided")
      const msg2 = await performHLMarginChecks(HLacc, detailed_quote_marginused, detailed_base_marginused);
      msg.push(msg2);
    }

  return msg;
}

async function performHLMarginChecks(HLacc, quote_marginused, base_marginused){
  const marginSummary = await getUserPerpMargin(HLacc);

  if (marginSummary.success) {
    const PotenMarginmargin = marginSummary.universe.accountValue - quote_marginused - base_marginused;
    const msg = {type:"text", data:`Additional Info:
\`Available Margin:\` ${marginSummary.universe.accountValue}
\`Potential Margin used:\` ${quote_marginused + base_marginused}
  
\`Top Up Required?:\` ${PotenMarginmargin > 0?"No":"Yes"}`};
      return msg;
  }
  return null;
}






function parseNumber(inputString) {
  // Remove $ or %
  const sanitized = inputString.replace(/\$/g, "").replace(/%/g, "");
  return parseFloat(sanitized);
}

// helper – force 3 dp, drop trailing zeros if you like
const n3 = (n) =>
  new Intl.NumberFormat('en-US', {
  useGrouping: false,  
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
}).format(n); 
const d2 = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
}).format(n);  

// helper: round UP to `decimals` places
function roundUp(value, decimals = 3) {
  const factor = 10 ** decimals;
  return Math.ceil(value * factor) / factor;
}