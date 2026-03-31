import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILE = path.join(__dirname, "server.log");

function logToFile(msg: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${msg}\n`);
}

logToFile("SERVER STARTING...");

const DATA_FILE = path.join(__dirname, "data.json");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "20901";

// Initial data structure
const INITIAL_DATA = {
  events: [
    { id: 'm1-1', title: '신정', date: '2026-01-01', category: 'schedule', isHoliday: true },
    { id: 'm2-16', title: '설날', date: '2026-02-16', category: 'schedule', isHoliday: true },
    { id: 'm2-17', title: '설날', date: '2026-02-17', category: 'schedule', isHoliday: true },
    { id: 'm2-18', title: '설날', date: '2026-02-18', category: 'schedule', isHoliday: true },
    { id: 'm3-1', title: '3.1절', date: '2026-03-01', category: 'schedule', isHoliday: true },
    { id: 'm3-2', title: '대체공휴일(3.1절)', date: '2026-03-02', category: 'schedule', isHoliday: true },
    { id: 'm3-3', title: '입학식 및 신입생 오리엔테이션', date: '2026-03-03', category: 'schedule' },
    { id: 'm3-4', title: '1학년 진단평가', date: '2026-03-04', category: 'exam' },
    { id: 'm3-10', title: '학교설명회 및 학부모총회', date: '2026-03-10', category: 'schedule' },
    { id: 'm3-24', title: '3월 전국연합학력평가', date: '2026-03-24', category: 'exam' },
    { id: 'm4-8', title: '1학기 학부모 상담주간', date: '2026-04-08', category: 'schedule' },
    { id: 'm4-29', title: '1학기 1회고사(중간고사)', date: '2026-04-29', category: 'exam' },
    { id: 'm4-30', title: '1학기 1회고사(중간고사)', date: '2026-04-30', category: 'exam' },
    { id: 'm5-1', title: '노동절', date: '2026-05-01', category: 'schedule', isHoliday: true },
    { id: 'm5-4', title: '1학기 1회고사(중간고사)', date: '2026-05-04', category: 'exam' },
    { id: 'm5-5', title: '어린이날', date: '2026-05-05', category: 'schedule', isHoliday: true },
    { id: 'm5-6', title: '1학기 1회고사(중간고사)', date: '2026-05-06', category: 'exam' },
    { id: 'm5-15', title: '스승의 날', date: '2026-05-15', category: 'schedule' },
    { id: 'm5-24', title: '부처님 오신 날', date: '2026-05-24', category: 'schedule', isHoliday: true },
    { id: 'm5-25', title: '대체공휴일(부처님 오신 날)', date: '2026-05-25', category: 'schedule', isHoliday: true },
    { id: 'm6-3', title: '제9회 전국동시지방선거일', date: '2026-06-03', category: 'schedule', isHoliday: true },
    { id: 'm6-4', title: '6월 전국연합학력평가', date: '2026-06-04', category: 'exam' },
    { id: 'm6-6', title: '현충일', date: '2026-06-06', category: 'schedule', isHoliday: true },
    { id: 'm7-1', title: '1학기 2회고사(기말고사)', date: '2026-07-01', category: 'exam' },
    { id: 'm7-2', title: '1학기 2회고사(기말고사)', date: '2026-07-02', category: 'exam' },
    { id: 'm7-3', title: '1학기 2회고사(기말고사)', date: '2026-07-03', category: 'exam' },
    { id: 'm7-6', title: '1학기 2회고사(기말고사)', date: '2026-07-06', category: 'exam' },
    { id: 'm7-16', title: '여름 방학식', date: '2026-07-16', category: 'schedule' },
    { id: 'm7-17', title: '제헌절', date: '2026-07-17', category: 'schedule' },
    { id: 'm8-15', title: '광복절', date: '2026-08-15', category: 'schedule', isHoliday: true },
    { id: 'm8-17', title: '대체공휴일(광복절)', date: '2026-08-17', category: 'schedule', isHoliday: true },
    { id: 'm8-18', title: '2학기 개학식', date: '2026-08-18', category: 'schedule' },
    { id: 'm9-2', title: '9월 수능모의평가', date: '2026-09-02', category: 'exam' },
    { id: 'm9-24', title: '추석', date: '2026-09-24', category: 'schedule', isHoliday: true },
    { id: 'm9-25', title: '추석', date: '2026-09-25', category: 'schedule', isHoliday: true },
    { id: 'm9-26', title: '추석', date: '2026-09-26', category: 'schedule', isHoliday: true },
    { id: 'm9-28', title: '대체공휴일(추석)', date: '2026-09-28', category: 'schedule', isHoliday: true },
    { id: 'm10-3', title: '개천절', date: '2026-10-03', category: 'schedule', isHoliday: true },
    { id: 'm10-5', title: '대체공휴일(개천절)', date: '2026-10-05', category: 'schedule', isHoliday: true },
    { id: 'm10-9', title: '한글날', date: '2026-10-09', category: 'schedule', isHoliday: true },
    { id: 'm10-13', title: '10월 전국연합학력평가', date: '2026-10-13', category: 'exam' },
    { id: 'm10-19', title: '2학기 1회고사(중간고사)', date: '2026-10-19', category: 'exam' },
    { id: 'm10-20', title: '2학기 1회고사(중간고사)', date: '2026-10-20', category: 'exam' },
    { id: 'm10-21', title: '2학기 1회고사(중간고사)', date: '2026-10-21', category: 'exam' },
    { id: 'm10-22', title: '2학기 1회고사(중간고사)', date: '2026-10-22', category: 'exam' },
    { id: 'm11-12', title: '대학수학능력시험(수능)', date: '2026-11-12', category: 'exam', isHoliday: true },
    { id: 'm11-13', title: '수능 다음날 재량휴업일', date: '2026-11-13', category: 'schedule', isHoliday: true },
    { id: 'm12-14', title: '2학기 2회고사(기말고사)', date: '2026-12-14', category: 'exam' },
    { id: 'm12-15', title: '2학기 2회고사(기말고사)', date: '2026-12-15', category: 'exam' },
    { id: 'm12-16', title: '2학기 2회고사(기말고사)', date: '2026-12-16', category: 'exam' },
    { id: 'm12-17', title: '2학기 2회고사(기말고사)', date: '2026-12-17', category: 'exam' },
    { id: 'm12-25', title: '성탄절', date: '2026-12-25', category: 'schedule', isHoliday: true },
    { id: 'm12-31', title: '겨울 방학식', date: '2026-12-31', category: 'schedule' },
  ],
  announcements: [],
  examScopes: [],
  assessments: [],
  activities: [],
  users: []
};

// Load or initialize data
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_DATA, null, 2));
    return INITIAL_DATA;
  }
  try {
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    const data = JSON.parse(content);
    // Ensure all collections exist in existing data
    let modified = false;
    ["announcements", "examScopes", "assessments", "activities"].forEach(col => {
      if (!data[col]) {
        data[col] = INITIAL_DATA[col as keyof typeof INITIAL_DATA];
        modified = true;
      }
    });
    if (modified) saveData(data);
    return data;
  } catch (e) {
    console.error("Error loading data file, resetting to initial data", e);
    return INITIAL_DATA;
  }
}

function saveData(data: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use((req, res, next) => {
    logToFile(`${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    console.log("Health check hit");
    res.json({ status: "ok" });
  });

  app.get("/api/debug", (req, res) => {
    const data = loadData();
    res.json({
      collections: collections,
      dataKeys: Object.keys(data),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: PORT
      }
    });
  });

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "비밀번호가 틀렸습니다." });
    }
  });

  // Generic CRUD for collections
  const collections = ["events", "announcements", "examScopes", "assessments", "activities", "users"];
  
  console.log("Registering API routes for:", collections);
  
  collections.forEach(collection => {
    const route = `/api/${collection}`;
    console.log(`Registering GET ${route}`);
    app.get(route, (req, res) => {
      console.log(`GET ${route} hit`);
      const data = loadData();
      res.json(data[collection] || []);
    });

    console.log(`Registering POST ${route}`);
    app.post(route, (req, res) => {
      console.log(`POST ${route} hit`);
      const { id, ...item } = req.body;
      const data = loadData();
      if (!data[collection]) data[collection] = [];
      
      const index = data[collection].findIndex((i: any) => i.id === id);
      if (index !== -1) {
        data[collection][index] = { id, ...item };
      } else {
        data[collection].push({ id, ...item });
      }
      
      saveData(data);
      res.json({ success: true });
    });

    console.log(`Registering DELETE ${route}/:id`);
    app.delete(`${route}/:id`, (req, res) => {
      console.log(`DELETE ${route}/${req.params.id} hit`);
      const { id } = req.params;
      const data = loadData();
      if (!data[collection]) return res.json({ success: true });
      
      data[collection] = data[collection].filter((i: any) => i.id !== id);
      saveData(data);
      res.json({ success: true });
    });
  });

  // Catch-all for unmatched API routes
  app.all("/api/*", (req, res) => {
    console.log(`Unmatched API route: ${req.method} ${req.url}`);
    res.status(404).json({ error: "API route not found" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
