
import { bot } from './telegram.js';   // path relative to the API folder

export default async function handler(req, res) {
    console.log("A new alert.")
    /* 1. Only POSTs are accepted */
    if (req.method !== 'POST') {
            console.log("Not POST method.")
            return res.status(405).send('Method Not Allowed');   // <- 405 for GET etc.
    }
    
    /* 2. Which Telegram chat to forward to? */
    const { chat: chatId } = req.query;                    // /api/…?chat=123
    if (!chatId) {
            console.log("No Chat ID provided.")
            return res.status(400).send('Missing ?chat=');
    }

    /* 3. The TradingView payload (may be JSON or plain text) */
    console.log("Translating payload body.")
    const text = await new Promise((r, x) => {
        let buf = '';
        req.on('data', (c) => (buf += c));
        req.on('end',  () => r(buf));
        req.on('error', x);
    });
    
    let pretty = text;
    try {
        const obj = JSON.parse(text);
        pretty = '```json\n' + JSON.stringify(obj, null, 2) + '\n```';
    } catch { /* silently ignore */ }
        
    try {
        /* 4. Relay to Telegram */
        await bot.telegram.sendMessage(
            chatId,
            `📈 *TradingView Alert*\n${pretty}`,
            { parse_mode: 'Markdown' }
          );
          res.status(200).send('OK');
    } catch (err) {
      console.error('Telegram sendMessage failed:', err);
      res.status(500).send('Telegram error');
    }
}