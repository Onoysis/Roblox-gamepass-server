import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const ROBLOX_INVENTORY_URL = "https://inventory.roblox.com/v1/users";

app.get("/passes/:userId", async (req, res) => {
    const userId = req.params.userId;

    if (!userId) return res.status(400).json({ success: false, error: "Missing userId" });

    let allItems = [];
    let cursor = "";

    try {
        do {
            const url = `${ROBLOX_INVENTORY_URL}/${userId}/items/GamePass?limit=100&cursor=${cursor}`;
            
            const r = await fetch(url, {
                headers: { "User-Agent": "RobloxBackend/1.0" }
            });

            if (!r.ok) {
                return res.status(r.status).json({ success: false, error: `Roblox API returned ${r.status}` });
            }

            const data = await r.json();

            if (!data.data) break;

            for (const item of data.data) {
                if (
                    item.creator &&
                    item.creator.id == parseInt(userId) &&
                    item.product &&
                    item.product.isForSale
                ) {
                    allItems.push({
                        id: item.id,
                        name: item.name,
                        price: item.product.priceInRobux
                    });
                }
            }

            cursor = data.nextPageCursor;
        } while (cursor);

        res.json({ success: true, items: allItems });
    } catch (e) {
        console.error("Backend error:", e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get("/", (_, res) => res.send("Backend alive"));

app.listen(3000, () => console.log("Backend running on port 3000"));
