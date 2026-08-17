const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', '..', '数据');
const dbDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'restaurants.db');
const db = new Database(dbPath);

db.exec(`
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

  CREATE INDEX IF NOT EXISTS idx_area ON restaurants(area);
  CREATE INDEX IF NOT EXISTS idx_type_name ON restaurants(type_name);
  CREATE INDEX IF NOT EXISTS idx_name ON restaurants(name);
`);

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

const processRestaurantData = (row, area) => {
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
};

const importData = async () => {
  const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.csv'));
  
  console.log(`Found ${files.length} CSV files to import`);

  const insertStmt = db.prepare(`
    INSERT INTO restaurants (
      area, type_code, type_name, name, address, longitude, latitude,
      phone, business_hours, rating, average_price, business_district
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((restaurants) => {
    for (const restaurant of restaurants) {
      try {
        insertStmt.run(
          restaurant.area,
          restaurant.type_code,
          restaurant.type_name,
          restaurant.name,
          restaurant.address,
          restaurant.longitude,
          restaurant.latitude,
          restaurant.phone,
          restaurant.business_hours,
          restaurant.rating,
          restaurant.average_price,
          restaurant.business_district
        );
      } catch (error) {
        console.error('Error inserting restaurant:', restaurant.name, error);
      }
    }
  });

  let totalImported = 0;

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    console.log(`Processing file: ${file}`);

    try {
      const rows = await parseCSV(filePath);
      const area = path.basename(file, '.csv');
      
      const restaurants = rows.map(row => processRestaurantData(row, area));
      
      insertMany(restaurants);
      
      totalImported += restaurants.length;
      console.log(`Imported ${restaurants.length} restaurants from ${file}`);
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }

  console.log(`\nTotal restaurants imported: ${totalImported}`);
  
  const count = db.prepare('SELECT COUNT(*) as count FROM restaurants').get();
  console.log(`Total restaurants in database: ${count.count}`);

  db.close();
};

importData().catch(console.error);
