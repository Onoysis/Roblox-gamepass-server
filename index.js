import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.get("/passes/:userId", async (req, res) => {
    const userId = req.params.userId;
    let allItems = [];
    let cursor = "";

    try {
        do {
            const url =
                `https://inventory.roblox.com/v1/users/${userId}/items/GamePass?limit=100&cursor=${cursor}`;

            const r = await fetch(url);
            const data = await r.json();

            if (!data.data) break;

            for (const item of data.data) {
                if (
                    item.creator &&
                    item.creator.id == userId &&
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
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get("/", (_, res) => {
    res.send("Backend alive");
});

app.listen(3000, () => {
    console.log("Backend running on port 3000");
});
