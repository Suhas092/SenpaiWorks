/**
 * SenpaiWorks - Telegram Alert Service
 * backend/telegram.js
 */

if (!process.env.TELEGRAM_BOT_TOKEN) {
  require('dotenv').config();
}

async function sendTelegramAlert(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[Telegram] Alert skipped: Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Telegram] Alert delivery failed (HTTP ${res.status}):`, errText);
      return false;
    }

    const data = await res.json();
    console.log('[Telegram] Alert delivered successfully, messageId:', data.result?.message_id);
    return true;
  } catch (err) {
    console.warn('[Telegram] Alert exception (ignored to prevent flow disruption):', err.message);
    return false;
  }
}

module.exports = {
  sendTelegramAlert
};
