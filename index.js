import express from "express";

const app = express();
app.use(express.json());

const UNIVERSE_API = "https://games.roblox.com/v1/users/";
const PASSES_API = "https://apis.roblox.com/marketplace-items/v1/items";

async function fetchJSON(url) {
    const res = await fetch(url, { headers: { "User-Agent": "RobloxUniverseBackend/1.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

async function fetchUserUniverses(userId) {
    try {
        const data = await fetchJSON(`${UNIVERSE_API}${userId}/universes`);
        return data.data?.map(u => u.id) || [];
    } catch (err) {
        console.error("Error fetching universes:", err);
        return [];
    }
}

async function fetchUniversePasses(userId, universeId) {
    let allItems = [];
    let cursor = null;
    try {
        do {
            let url = `${PASSES_API}?universeIds=${universeId}&assetType=34&limit=100`;
            if (cursor) url += `&cursor=${cursor}`;

            const data = await fetchJSON(url);
            if (!data.data || !data.data[universeId]) break;

            const items = data.data[universeId].items;

            for (const item of items) {
                if (item.creatorTargetId === userId) {
                    allItems.push({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        type: item.assetType,
                        universeId: universeId
                    });
                }
            }

            cursor = data.data[universeId].nextPageCursor || null;
        } while (cursor);
    } catch (err) {
        console.error(`Error fetching passes for universe ${universeId}:`, err);
    }
    return allItems;
}

app.get("/passes/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (!userId) return res.status(400).json({ success: false, error: "Missing userId" });

    try {
        const universes = await fetchUserUniverses(userId);
        let allItems = [];

        for (const uni of universes) {
            const items = await fetchUniversePasses(userId, uni);
            allItems.push(...items);
        }

        // Sort by price
        allItems.sort((a, b) => a.price - b.price);

        res.json({ success: true, items: allItems });
    } catch (err) {
        console.error("Backend error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get("/", (_, res) => res.send("Auto Universe Backend alive"));

app.listen(3000, () => console.log("Backend running on port 3000"));
