import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/passes/:userId", async (req, res) => {
  const userId = req.params.userId;
  const items = [];

  try {
    const gamesRes = await fetch(
      "https://games.roproxy.com/v2/users/" +
        userId +
        "/games?accessFilter=Public&limit=50&sortOrder=Asc"
    );
    const games = await gamesRes.json();

    if (!games.data) {
      return res.json({ success: true, items: [] });
    }

    for (const game of games.data) {
      const placeId = game.rootPlace?.id;
      if (!placeId) continue;

      const uniRes = await fetch(
        "https://apis.roproxy.com/universes/v1/places/" +
          placeId +
          "/universe"
      );
      const uni = await uniRes.json();
      if (!uni.universeId) continue;

      const passRes = await fetch(
        "https://apis.roproxy.com/game-passes/v1/universes/" +
          uni.universeId +
          "/game-passes?passView=Full&pageSize=100"
      );
      const passes = await passRes.json();

      if (!passes.gamePasses) continue;

      for (const pass of passes.gamePasses) {
        if (
          pass.creator?.creatorId == userId &&
          pass.isForSale === true &&
          pass.price != null
        ) {
          items.push({
            id: pass.id,
            name: pass.name || "Gamepass",
            price: pass.price,
            universeId: uni.universeId
          });
        }
      }
    }

    res.json({ success: true, items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
