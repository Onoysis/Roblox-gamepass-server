import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/passes/:userId", async (req, res) => {
  const userId = req.params.userId;
  const results = [];

  try {
    const gamesRes = await fetch(
      \`https://games.roproxy.com/v2/users/\${userId}/games?accessFilter=Public&limit=50&sortOrder=Asc\`
    );
    const gamesJson = await gamesRes.json();

    if (!gamesJson.data) {
      return res.json({ success: true, items: [] });
    }

    for (const game of gamesJson.data) {
      const placeId = game.rootPlace?.id;
      if (!placeId) continue;

      const uniRes = await fetch(
        \`https://apis.roproxy.com/universes/v1/places/\${placeId}/universe\`
      );
      const uniJson = await uniRes.json();
      if (!uniJson.universeId) continue;

      const passRes = await fetch(
        \`https://apis.roproxy.com/game-passes/v1/universes/\${uniJson.universeId}/game-passes?passView=Full&pageSize=100\`
      );
      const passJson = await passRes.json();

      if (!passJson.gamePasses) continue;

      for (const pass of passJson.gamePasses) {
        if (
          pass.creator?.creatorId == userId &&
          pass.isForSale === true &&
          pass.price != null
        ) {
          results.push({
            id: pass.id,
            price: pass.price,
            name: pass.name || "Gamepass",
            universeId: uniJson.universeId
          });
        }
      }
    }

    res.json({ success: true, items: results });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal error" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
