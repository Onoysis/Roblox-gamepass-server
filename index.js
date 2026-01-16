import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const ROPROXY_BASE = "https://www.roproxy.com/users/inventory/list-json";

const ASSET_TYPE_IDS = {
  GamePass: 34,
  TShirt: 2,
  Shirt: 11,
  Pants: 12
};

async function fetchItems(userId, assetTypeId) {
  let allItems = [];
  let cursor = "";
  try {
    do {
      const url = `${ROPROXY_BASE}?userId=${userId}&assetTypeId=${assetTypeId}&itemsPerPage=100&cursor=${cursor}`;
      const res = await fetch(url, { headers: { "User-Agent": "RobloxBackend/1.0" } });
      if (!res.ok) break;
      const data = await res.json();
      if (!data.Data) break;

      for (const item of data.Data.Items) {
        if (item.Creator?.Id === parseInt(userId) && item.Product?.IsForSale) {
          allItems.push({
            id: item.Item.AssetId,
            name: item.Item.Name,
            price: item.Product.PriceInRobux,
            type: item.Item.AssetType
          });
        }
      }

      cursor = data.Data.nextPageCursor;
    } while (cursor);
  } catch (err) {
    console.error("Error fetching items:", err);
  }
  return allItems;
}

app.get("/passes/:userId", async (req, res) => {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ success: false, error: "Missing userId" });

  let allItems = [];
  for (const assetType of Object.values(ASSET_TYPE_IDS)) {
    const items = await fetchItems(userId, assetType);
    allItems.push(...items);
  }

  allItems.sort((a, b) => a.price - b.price);
  res.json({ success: true, items: allItems });
});

app.get("/", (_, res) => res.send("Backend alive"));

app.listen(3000, () => console.log("Backend running on port 3000"));
