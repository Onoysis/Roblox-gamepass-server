import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// ---- cache ----
const cache = new Map();
const CACHE_TIME = 5 * 60 * 1000;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function safeFetch(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url);

    if (res.status === 429) {
      await sleep(800 + i * 500);
      continue;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
  }
  throw new Error("Rate limited");
}

app.get("/passes/:userId", async (req, res) => {
  const userId = req.params.userId;

  const cached = cache.get(userId);
  if (cached && Date.now() - cached.time < CACHE_TIME) {
    return res.json(cached.data);
  }

  try {
    const items = [];

    const games = await safeFetch(
      `https://games.roproxy.com/v2/users/${userId}/games?accessFilter=Public&limit=50`
    );

    for (const game of games.data || []) {
      const placeId = game.rootPlace?.id;
      if (!placeId) continue;

      const universe = await safeFetch(
        `https://apis.roproxy.com/universes/v1/places/${placeId}/universe`
      );

      const universeId = universe.universeId;
      if (!universeId) continue;

      const passes = await safeFetch(
        `https://apis.roproxy.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`
      );

      for (const pass of passes.gamePasses || []) {
        if (
          pass.creator?.creatorId?.toString() !== userId ||
          !pass.isForSale ||
          !pass.price
        ) continue;

        items.push({
          id: pass.id,
          name: pass.name,
          price: pass.price,
          universeId,
          imageId: pass.iconImageAssetId
        });
      }

      await sleep(400);
    }

    const response = { success: true, items };
    cache.set(userId, { time: Date.now(), data: response });

    res.json(response);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
