export async function sendWhatsApp(to: string, message: string) {
  if (
    !process.env.THREESIXTY_DIALOG_API_KEY ||
    process.env.THREESIXTY_DIALOG_API_KEY === "placeholder"
  ) {
    console.log("[WhatsApp placeholder]", to, message);
    return;
  }
  await fetch("https://waba.360dialog.io/v1/messages", {
    method: "POST",
    headers: {
      "D360-API-KEY": process.env.THREESIXTY_DIALOG_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to, text: { body: message } }),
  });
}
