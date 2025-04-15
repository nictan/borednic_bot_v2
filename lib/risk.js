// lib/messages.js
import { msgError, msgPeriSize } from '../lib/messages.js';
import { getAssetContextForSymbol, getPerpsByName } from '../lib/hyper.js';

export async function pvpCalc2(args) {
  const token = args[0];
  const direction = args[1];
  const riskAmount = args[2];
  const stopLossPrice = args[3];

  // 2) Check direction
  if (direction.toUpperCase() !== "L" && direction.toUpperCase() !== "S") {
    return msgError("Please give L or S for direction input.");
  }

  // 3) Fetch token data
  const tokenData = await getAssetContextForSymbol(token);
  const riskAmountParsed = parseNumber(riskAmount);
  const stopLossPriceParsed = parseNumber(stopLossPrice);

  // 4) If success, compute totalAmount differently based on whether user typed '$'
  if (tokenData.success) {
    const directions = direction.toUpperCase() === "L" ? "Long" : "Short";
    const currentTokenPrice = tokenData.data.price;
    const tokenLeveraged = tokenData.data.leverage;
    
    const numTokens = direction.toUpperCase() === "L" ? riskAmountParsed / (currentTokenPrice - stopLossPriceParsed): riskAmountParsed / (stopLossPriceParsed - currentTokenPrice)
    const totalAmt = numTokens * currentTokenPrice;
    const marginUsed = totalAmt/tokenLeveraged;


    const msg = [
      { type:"text", data:`*Recommended Pvp Command:*` },
      { type:"text", data:`\`/${directions} ${token} ${tokenLeveraged}x ${d2(marginUsed)}\`` },
      { type:"text", data:`*DIRECTION DETAILS*
  
\`Trading Coin:\`  ${token}
\`Current Price:\`  ${d2(currentTokenPrice)}
\`Leverage:\`  ${tokenLeveraged}x
\`Direction:\`  ${directions}
\`Total Amount:\`  ${d2(totalAmt)}
\`Risk Amount:\`   ${d2(riskAmountParsed)}
\`Tokens to purchase:\`  ${numTokens}
\`Margin Used:\`  ${d2(marginUsed)}`}
    ];
    return msg;
  } else {
    return msgError("Unable to find the token you're trying to trade.");
  }
}

export async function pvpCalc(args) {
  const token = args[0];
  const direction = args[1];
  let numToken = args[2]; // e.g. "29" or "$200"
  const riskAmount = args[3] || "0";

  // 2) Check direction
  if (direction.toUpperCase() !== "L" && direction.toUpperCase() !== "S") {
    return msgError("Please give L or S for direction input.");
  }

  // 3) Fetch token data
  const tokenData = await getAssetContextForSymbol(token);
  const riskVal = parseNumber(riskAmount);

  // 4) If success, compute totalAmount differently based on whether user typed '$'
  if (tokenData.success) {
    let totalAmount;
    const directions = direction.toUpperCase() === "L" ? "long" : "short";

    if (numToken.startsWith("$")) {
      // user typed e.g. "$2000"
      totalAmount = Number(numToken.replace(/\$/g, ""));
      //console.log("Detected dollar input:", numToken);
    } else {
      // user typed e.g. "29"
      totalAmount = parseNumber(numToken) * tokenData.data.price;
      //console.log("Detected token input:", numToken);
    }

    // marginUsed is total amount / leverage
    const marginUsed = totalAmount / tokenData.data.leverage;

    const display_leverage = tokenData.data.leverage;
    const display_totalAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      // No decimal places; set this to 2 if you need cents
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0
    }).format(totalAmount);
      
    const display_riskAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      // No decimal places; set this to 2 if you need cents
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0
    }).format(riskVal);
      
    const display_marginAmt = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      // No decimal places; set this to 2 if you need cents
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0
    }).format(marginUsed);
  
    return [`*Recommended Pvp Command:*`,
      `\`/${directions} ${token} ${display_leverage}x ${marginUsed.toFixed(0)}\``,
      `-------------------------------
*DIRECTION DETAILS*
  
\`Trading Coin:\`  ${token}
\`Leverage:\`  ${display_leverage}x
\`Direction:\`  ${directions}
\`Risk Amount:\`   ${display_riskAmount}
\`Total Amount:\`  ${display_totalAmount}
\`Margin Used:\`  ${display_marginAmt}
  
_Remember to set TP and SL and stay disciplined and manage your risk!_`];
  }

  // If not successful, show an error
  return msgError("Unable to find the token you're trying to trade.");
}

export async function periCalc(args) {
  const pairStr = args[0];
  const direction = args[1];
  const riskStr = args[2];
  const slpStr = args[3];
  const tpStr = args[4] || "<tp>"; // If undefined, becomes "<tp>"
  const slStr = args[5] || "<sl>"; // If undefined, becomes "<sl>"

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
    const arr = msgPeriSize();
    const result = [`Invalid arguments.
Please ensure your risk and SL are numbers (with or without '%' / '$').`, ...arr];
    return result;
  }

  // helper – force 3 dp, drop trailing zeros if you like
  const fmt3 = (n) => Number(n).toFixed(3);          // "7.108"
  const usd3 = (n) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(n);  
  const usd2 = (n) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(n);  

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

  return [`*Recommended Peri Command:*`,
`\`/market ${direction_text} ${base}/${quote} ${roundedPositionSize} ${leverage}x ${fmt3(tpStr)} ${fmt3(slStr)}\``, 
`-----------------------------------
*Pair DETAILS*

\`Trading Pair:\`  ${base.toUpperCase()}/${quote.toUpperCase()}
\`Risk Amount:\`    ${usd2(riskVal)}
\`Take profit:\`    ${fmt3(tpStr)}
\`Stop Loss:\`        ${fmt3(slStr)}
\`Stop Loss %:\`    ${slVal}%
*Recommended Position Size (Total):* $ \`${roundedPositionSize}\`

_Stay disciplined and manage your risk!_`,
`*${detailed_base} Details:*
\`Leverage:\`              ${detailed_base_leverage}x
\`Position Size:\`  ${usd2(half_size)}
\`Margin Used:\`       ${usd2(detailed_base_marginused)}`,
`*${detailed_quote} Details:*
\`Leverage:\`              ${detailed_quote_leverage}x
\`Position Size:\`  ${usd2(half_size)}
\`Margin Used:\`       ${usd2(detailed_quote_marginused)}`];
}

function parseNumber(inputString) {
  // Remove $ or %
  const sanitized = inputString.replace(/\$/g, "").replace(/%/g, "");
  return parseFloat(sanitized);
}

// helper – force 3 dp, drop trailing zeros if you like
const n3 = (n) => Number(n).toFixed(3);          // "7.108"
const d3 = (n) =>
  new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
}).format(n);  
const d2 = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
}).format(n);  