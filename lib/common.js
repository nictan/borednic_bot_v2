/*
items = 
[
  { type: text
    data: "messages" },
  { type: image
    url: "http://some.png" }
]
 */
export async function replyTextandPhoto(ctx, content) {
    const items = Array.isArray(content) ? content : [content];
    //console.log(lines);
    for (const item of items) {
      if (item.type == "image") {
        await ctx.replyWithPhoto( item.url );
      } else {
        await ctx.reply(item.data, { parse_mode: 'Markdown' });
      }
    }
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