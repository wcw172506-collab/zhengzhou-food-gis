/**
 * 数据库初始化脚本
 * - 用于 Render 等无持久化磁盘的云平台
 * - 启动时检查 restaurants 表是否为空，为空则从 CSV 自动导入
 */
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Database = require('better-sqlite3');

const csvDir = path.join(__dirname, '..', 'data', 'csv');
const dbDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'restaurants.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');
db.pragma('temp_store = MEMORY');

// 建表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    area TEXT NOT NULL,
    type_code TEXT,
    type_name TEXT,
    name TEXT NOT NULL,
    address TEXT,
    longitude REAL,
    latitude REAL,
    phone TEXT,
    business_hours TEXT,
    rating REAL,
    average_price REAL,
    business_district TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_restaurants_area ON restaurants(area);
  CREATE INDEX IF NOT EXISTS idx_restaurants_type_name ON restaurants(type_name);
  CREATE INDEX IF NOT EXISTS idx_restaurants_name ON restaurants(name);
  CREATE INDEX IF NOT EXISTS idx_restaurants_address ON restaurants(address);
  CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(latitude, longitude);
`);

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

function processRow(row, area) {
  const longitude = parseFloat(row['经度(lon)'] || row['GCJ02_经度'] || row['WGS84_经度'] || 0);
  const latitude = parseFloat(row['纬度(lat)'] || row['GCJ02_纬度'] || row['WGS84_纬度'] || 0);
  const rating = parseFloat(row['评分'] || 0) || null;
  const averagePrice = parseFloat(row['人均消费（元）'] || 0) || null;

  return {
    area: area || row['区域'] || row['区县'] || '',
    type_code: row['餐饮类型编码'] || '',
    type_name: row['餐饮类型名称'] || '',
    name: row['POI名称'] || row['店铺名称'] || '',
    address: row['详细地址'] || row['地址'] || '',
    longitude: longitude || null,
    latitude: latitude || null,
    phone: row['联系电话'] || '',
    business_hours: row['营业时段'] || row['营业时间'] || '',
    rating: rating,
    average_price: averagePrice,
    business_district: row['商圈'] || ''
  };
}

async function ensureData() {
  const count = db.prepare('SELECT COUNT(*) as count FROM restaurants').get();
  if (count.count > 0) {
    console.log(`[init-db] 数据库已有 ${count.count} 条数据，跳过导入`);
    return;
  }

  if (!fs.existsSync(csvDir)) {
    console.warn(`[init-db] CSV 目录不存在: ${csvDir}`);
    return;
  }

  const files = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv'));
  console.log(`[init-db] 数据库为空，开始从 ${files.length} 个 CSV 文件导入...`);

  const insertStmt = db.prepare(`
    INSERT INTO restaurants (
      area, type_code, type_name, name, address, longitude, latitude,
      phone, business_hours, rating, average_price, business_district
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((rows) => {
    for (const r of rows) {
      try {
        insertStmt.run(
          r.area, r.type_code, r.type_name, r.name, r.address,
          r.longitude, r.latitude, r.phone, r.business_hours,
          r.rating, r.average_price, r.business_district
        );
      } catch (e) {
        // 忽略单行错误
      }
    }
  });

  let total = 0;
  for (const file of files) {
    try {
      const rows = await parseCSV(path.join(csvDir, file));
      const area = path.basename(file, '.csv');
      const data = rows.map(r => processRow(r, area));
      insertMany(data);
      total += data.length;
      console.log(`[init-db] 已导入 ${file}: ${data.length} 条`);
    } catch (e) {
      console.error(`[init-db] 导入 ${file} 失败:`, e.message);
    }
  }

  const after = db.prepare('SELECT COUNT(*) as count FROM restaurants').get();
  console.log(`[init-db] 导入完成，共 ${after.count} 条数据`);
}

module.exports = { db, ensureData };
