import express from "express";
import { createServer as createHttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { 
  InventoryItem, 
  StockTransaction, 
  UserAccount, 
  ChangeRequest, 
  AuditEntry,
  ViewMode
} from "./types";

const PORT = 3000;

// In-memory "cloud" state
let authorizedUsers: UserAccount[] = [];
let inventory: InventoryItem[] = [
  { gsm: '280', size: '54', stock: 1279 },
  { gsm: '280', size: '56', stock: 243 },
  { gsm: '280', size: '58', stock: 1604 },
  { gsm: '280', size: '59', stock: 442 },
  { gsm: '280', size: '60', stock: 1351 },
  { gsm: '280', size: '63', stock: 568 },
  { gsm: '280', size: '65', stock: 1453 },
  { gsm: '280', size: '68', stock: 984 },
  { gsm: '280', size: '70', stock: 714 },
  { gsm: '280', size: '73', stock: 941 },
  { gsm: '280', size: '76', stock: 926 },
  { gsm: '280', size: '78', stock: 0 },
  { gsm: '280', size: '80', stock: 2029 },
  { gsm: '280', size: '83', stock: 1337 },
  { gsm: '280', size: '86', stock: 298 },
  { gsm: '280', size: '88', stock: 1953 },
  { gsm: '280', size: '90', stock: 3384 },
  { gsm: '280', size: '93', stock: 1262 },
  { gsm: '280', size: '96', stock: 1315 },
  { gsm: '280', size: '98', stock: 1330 },
  { gsm: '280', size: '100', stock: 1999 },
  { gsm: '280', size: '104', stock: 955 },
  { gsm: '280', size: '108', stock: 1568 },
].map(sku => ({
  id: `${sku.gsm}-${sku.size.replace('*','-')}`,
  size: sku.size,
  gsm: sku.gsm,
  closingStock: sku.stock || 0,
  minStock: 500,
  category: (sku.size.includes('*') ? 'DOUBLE' : 'SINGLE') as any
}));
let transactions: StockTransaction[] = [];
let changeRequests: ChangeRequest[] = [];
let auditLogs: AuditEntry[] = [];

async function startServer() {
  const app = express();
  app.use(express.json());
  
  const httpServer = createHttpServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  // Broadcast to all connected clients
  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // API Routes
  app.get("/api/state", (req, res) => {
    res.json({
      authorizedUsers,
      inventory,
      transactions,
      changeRequests,
      auditLogs
    });
  });

  app.post("/api/register", (req, res) => {
    const newUser: UserAccount = req.body;
    if (authorizedUsers.some(u => u.username === newUser.username)) {
      return res.status(400).json({ error: "Username already exists" });
    }
    authorizedUsers.push(newUser);
    broadcast({ type: "USER_REGISTERED", payload: newUser });
    res.json({ status: "ok" });
  });

  app.post("/api/update-user", (req, res) => {
    const { username, status, role, allowedPages } = req.body;
    authorizedUsers = authorizedUsers.map(u => 
      u.username === username ? { ...u, status, role: role || u.role, allowedPages: allowedPages || u.allowedPages } : u
    );
    broadcast({ type: "USER_UPDATED", payload: { username, status, role, allowedPages } });
    broadcast({ type: "STATE_UPDATED", payload: { authorizedUsers } });
    res.json({ status: "ok" });
  });

  app.post("/api/inventory", (req, res) => {
    inventory = req.body;
    broadcast({ type: "STATE_UPDATED", payload: { inventory } });
    res.json({ status: "ok" });
  });

  app.post("/api/transactions", (req, res) => {
    transactions = req.body;
    broadcast({ type: "STATE_UPDATED", payload: { transactions } });
    res.json({ status: "ok" });
  });

  app.post("/api/change-requests", (req, res) => {
    changeRequests = req.body;
    broadcast({ type: "STATE_UPDATED", payload: { changeRequests } });
    res.json({ status: "ok" });
  });

  app.post("/api/audit-logs", (req, res) => {
    auditLogs = req.body;
    broadcast({ type: "STATE_UPDATED", payload: { auditLogs } });
    res.json({ status: "ok" });
  });

  app.post("/api/broadcast", (req, res) => {
    broadcast(req.body);
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
