const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/created-passes/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
        const url =
            "https://catalog.roblox.com/v1/search/items" +
            "?category=Assets" +
            "&assetType=GamePass" +
            "&creatorType=User" +
            `&creatorTargetId=${userId}` +
            "&limit=30";

        const response = await fetch(url);

        if (!response.ok) {
            return res.json([]);
        }

        const data = await response.json();

        const passes = data.data.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price
        }));

        res.json(passes);
    } catch (error) {
        console.error("Fetch failed:", error);
        res.json([]);
    }
});

app.get("/", (req, res) => {
    res.send("Roblox Creator GamePass Server running");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
