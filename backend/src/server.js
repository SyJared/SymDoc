const express = require("express");
const cors = require("cors");
require("dotenv").config();
const documentsRouter = require("./routes/documentRouter");   // ← add this

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({ message: "Backend is running!" });
});

app.use("/api/documents", documentsRouter);   // ← add this

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});