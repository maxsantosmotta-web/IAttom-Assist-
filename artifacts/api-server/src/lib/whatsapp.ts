import { logger } from "./logger.js";

const GRAPH_API_VERSION = "v21.0";

export interface WhatsAppSendConfig {
  phoneNumberId: string;
  accessToken: string;
}

export async function sendWhatsAppText(
  to: string,
  body: string,
  config: WhatsAppSendConfig,
): Promise<unknown> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${config.phoneNumberId}/messages`;

  logger.info({ to, phoneNumberId: config.phoneNumberId }, "whatsapp: sending text message");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  const data = (await res.json()) as unknown;

  if (!res.ok) {
    logger.error({ status: res.status, data }, "whatsapp: send failed");
  } else {
    logger.info({ to }, "whatsapp: message sent successfully");
  }

  return data;
}
