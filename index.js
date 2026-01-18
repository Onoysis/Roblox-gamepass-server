import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

app.get("/passes/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const games = await getJson(
      `https://games.roproxy.com/v2/users/${userId}/games?accessFilter=Public&limit=50&sortOrder=Asc`
    );

    const items = [];

    for (const game of games.data || []) {
      const placeId = game.rootPlace?.id;
      if (!placeId) continue;

      const universe = await getJson(
        `https://apis.roproxy.com/universes/v1/places/${placeId}/universe`
      );

      const universeId = universe.universeId;
      if (!universeId) continue;

      const passes = await getJson(
        `https://apis.roproxy.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`
      );

      for (const pass of passes.gamePasses || []) {
        if (
          pass.creator?.creatorId?.toString() !== userId ||
          !pass.isForSale ||
          !pass.price
        ) continue;

        const asset = await getJson(
          `https://economy.roproxy.com/v2/assets/${pass.id}/details`
        );

        items.push({
          id: pass.id,
          name: pass.name,
          price: pass.price,
          universeId,
          imageId: asset.IconImageAssetId
        });
      }
    }

    res.json({ success: true, items });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
