// lib/info.js
export async function fetchPriceInfo(ticker) {
    const res = await fetch(`${process.env.PRICE_API}/price/${ticker}`);
    if (!res.ok) throw new Error('price API error');
    const data = await res.json();
    return `*${ticker}* $${data.price}`;
  }
  