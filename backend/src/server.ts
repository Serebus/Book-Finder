import dotenv from "dotenv";
import { createApp } from "./app.js";

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Book-Finder backend running on http://localhost:${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/health`);
  console.log(`[Server] Auth API routes: http://localhost:${PORT}/api/auth`);
});
