import { redisClient } from "../db/cache";

export async function checkBuyeeHealth(): Promise<boolean> {
  let health: boolean;

  await redisClient.connect();
  const cachedHealth = await redisClient.get("buyeeHealth");

  if (cachedHealth) {
    health = JSON.parse(cachedHealth);
  } else {
    console.log('cache not hit');
    const isOkay = await fetch("https://buyee.jp", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
      },
    })
      .then((html) => html.text())
      .then(async (html) => {
        return !html.includes("Site Maintenance");
      });

    await redisClient.set('buyeeHealth', JSON.stringify(isOkay));
	// expire after 5 minutes
    await redisClient.expire('buyeeHealth', 60 * 5);

    health = isOkay;
  }

  await redisClient.disconnect();

  return health;
}