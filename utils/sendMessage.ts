// telegram.ts
import "dotenv/config";

export async function sendMessage(text: string): Promise<void> {
  const token: string | undefined = process.env.TELEGRAM_BOT_TOKEN;
  const chatId: string | undefined = process.env.TELEGRAM_GROUP_CHAT_ID;

  if (!token || !chatId) {
    console.error("Environment variables for Telegram not set.");
    return;
  }

  const url: string = `https://api.telegram.org/bot${token}/sendMessage`;
  const params = {
    chat_id: chatId,
    text: text,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();

    if (data.ok) {
      console.log(`Message sent: ${text}`);
    } else {
      console.log(`Failed to send message: ${data.description}`);
    }
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}
