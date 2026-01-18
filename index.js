import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

/*
  GET /passes/:userId
  Returns experience-based gamepasses + image URLs
*/
app.get("/passes/:userId", async (req, res) => {
  const userId = req.params.userId;
  const results = [];

  try {
    // 1️⃣ Fetch user's public games
    const gamesRes = await fetch(
      `https://games.roproxy.com/v2/users/${userId}/games?accessFilter=Public&limit=50&sortOrder=Asc`
    );
    const gamesJson = await gamesRes.json();

    if (!gamesJson.data) {
      return res.json({ success: true, items: [] });
    }

    for (const game of gamesJson.data) {
      const placeId = game.rootPlace?.id;
      if (!placeId) continue;

      // 2️⃣ Convert placeId → universeId
      const uniRes = await fetch(
        `https://apis.roproxy.com/universes/v1/places/${placeId}/universe`
      );
      const uniJson = await uniRes.json();
      const universeId = uniJson.universeId;
      if (!universeId) continue;

      // 3️⃣ Fetch gamepasses for universe
      const passRes = await fetch(
        `https://apis.roproxy.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`
      );
      const passJson = await passRes.json();
      if (!passJson.gamePasses) continue;

      for (const pass of passJson.gamePasses) {
        if (
          pass.creator?.creatorId == userId &&
          pass.isForSale === true &&
          pass.price
        ) {
          // 4️⃣ Fetch image via thumbnails API
          const thumbRes = await fetch(
            `https://thumbnails.roproxy.com/v1/game-passes?gamePassIds=${pass.id}&size=150x150&format=Png`
          );
          const thumbJson = await thumbRes.json();
          const imageUrl = thumbJson?.data?.[0]?.imageUrl || null;

          results.push({
            id: pass.id,
            name: pass.name,
            price: pass.price,
            universeId,
            imageUrl
          });
        }
      }
    }

    res.json({
      success: true,
      items: results
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal error" });
  }
});

app.get("/", (_, res) => {
  res.send("Roblox Gamepass Backend Running");
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
