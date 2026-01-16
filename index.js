import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Simple cache
const cache = new Map();
const CACHE_TIME = 60 * 1000;

// Axios instance with Roblox-safe headers
const roblox = axios.create({
  timeout: 10000,
  headers: {
    "User-Agent": "Roblox/WinInet",
    "Accept": "application/json"
  }
});

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expire) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    expire: Date.now() + CACHE_TIME
  });
}

async function getUniverseOwner(universeId) {
  const res = await roblox.get(
    `https://games.roblox.com/v1/games?universeIds=${universeId}`
  );
  return res.data.data[0].creator;
}

async function fetchPasses(owner) {
  let url;

  if (owner.type === "User") {
    url = `https://inventory.roblox.com/v1/users/${owner.id}/items/GamePass?limit=100`;
  } else {
    url = `https://inventory.roblox.com/v1/groups/${owner.id}/items/GamePass?limit=100`;
  }

  const res = await roblox.get(url);
  return res.data.data || [];
}

app.get("/passes/:universeId", async (req, res) => {
  const universeId = req.params.universeId;

  const cached = getCached(universeId);
  if (cached) return res.json(cached);

  try {
    const owner = await getUniverseOwner(universeId);
    const passes = await fetchPasses(owner);

    const result = passes
      .filter(p => p.price !== null)
      .map(p => ({
        id: p.assetId,
        name: p.name,
        price: p.price
      }));

    setCache(universeId, result);
    res.json(result);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch passes" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
