{\rtf1\ansi\ansicpg1252\cocoartf2867
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const express = require("express");\
const fetch = require("node-fetch");\
\
const app = express();\
const PORT = process.env.PORT || 3000;\
\
// Endpoint to get a user's gamepasses\
app.get("/gamepasses/:userId", async (req, res) => \{\
    const userId = req.params.userId;\
\
    try \{\
        const response = await fetch(\
            `https://inventory.roblox.com/v1/users/$\{userId\}/assets/3?limit=100`\
        );\
\
        if (!response.ok) \{\
            return res.status(500).json(\{ error: "Roblox API request failed" \});\
        \}\
\
        const data = await response.json();\
\
        // Extract gamepass IDs\
        const gamepasses = data.data.map(item => item.assetId);\
\
        res.json(gamepasses);\
    \} catch (error) \{\
        console.error(error);\
        res.status(500).json(\{ error: "Server error" \});\
    \}\
\});\
\
// Health check (optional but helpful)\
app.get("/", (req, res) => \{\
    res.send("Roblox Gamepass Server is running");\
\});\
\
// Start server\
app.listen(PORT, () => \{\
    console.log(`Server running on port $\{PORT\}`);\
\});}