const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/gamepasses/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
        const response = await fetch(
            `https://inventory.roblox.com/v1/users/${userId}/assets/3?limit=100`
        );

        if (!response.ok) {
            return res.status(500).json({ error: "Roblox API request failed" });
        }

        const data = await response.json();
        const gamepasses = data.data.map(item => item.assetId);

        res.json(gamepasses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

app.get("/", (req, res) => {
    res.send("Roblox Gamepass Server is running");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
