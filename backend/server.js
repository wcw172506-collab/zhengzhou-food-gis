const express = require('express');
const cors = require('cors');
const compression = require('compression');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, ensureData } = require('./scripts/init-db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: '无效的认证令牌' });
    }
    req.user = user;
    next();
  });
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: '请填写所有必填字段' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名或邮箱已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hashedPassword);

    res.json({ success: true, message: '注册成功', userId: result.lastInsertRowid });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '请提供用户名和密码' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

app.get('/api/users', authenticateToken, (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: '获取用户列表失败' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ success: false, message: '请填写所有必填字段' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名或邮箱已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)').run(username, email, hashedPassword, role);

    res.json({ success: true, message: '创建成功', userId: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: '创建用户失败' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role } = req.body;

    if (!username || !email || !role) {
      return res.status(400).json({ success: false, message: '请填写所有必填字段' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?').get(username, email, id);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名或邮箱已存在' });
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.prepare('UPDATE users SET username = ?, email = ?, password = ?, role = ? WHERE id = ?').run(username, email, hashedPassword, role, id);
    } else {
      db.prepare('UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?').run(username, email, role, id);
    }

    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: '更新用户失败' });
  }
});

app.delete('/api/users/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: '删除用户失败' });
  }
});

app.get('/api/restaurants', (req, res) => {
  try {
    const { area, type, keyword, page = 1, pageSize = 50 } = req.query;
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;

    let query = 'SELECT * FROM restaurants WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM restaurants WHERE 1=1';
    const params = [];

    if (area && area !== 'all') {
      query += ' AND area = ?';
      countQuery += ' AND area = ?';
      params.push(area);
    }

    if (type && type !== 'all') {
      query += ' AND type_name = ?';
      countQuery += ' AND type_name = ?';
      params.push(type);
    }

    if (keyword) {
      query += ' AND (name LIKE ? OR address LIKE ?)';
      countQuery += ' AND (name LIKE ? OR address LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    const countStmt = db.prepare(countQuery);
    const { total } = countStmt.get(...params);

    query += ' ORDER BY id LIMIT ? OFFSET ?';
    params.push(pageSizeNum, offset);

    const stmt = db.prepare(query);
    const restaurants = stmt.all(...params);

    res.json({
      restaurants,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum)
      }
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/restaurants/map', (req, res) => {
  try {
    const { area, type } = req.query;

    let query = 'SELECT id, name, longitude, latitude, type_name, area, address FROM restaurants WHERE longitude IS NOT NULL AND latitude IS NOT NULL';
    const params = [];

    if (area && area !== 'all') {
      query += ' AND area = ?';
      params.push(area);
    }

    if (type && type !== 'all') {
      query += ' AND type_name = ?';
      params.push(type);
    }

    query += ' ORDER BY id';

    const stmt = db.prepare(query);
    const restaurants = stmt.all(...params);

    res.json({
      restaurants,
      total: restaurants.length
    });
  } catch (error) {
    console.error('Error fetching map restaurants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/restaurants/filters', (req, res) => {
  try {
    const areas = db.prepare('SELECT DISTINCT area FROM restaurants ORDER BY area').all().map(r => r.area);
    const types = db.prepare('SELECT DISTINCT type_name FROM restaurants ORDER BY type_name').all().map(r => r.type_name);
    
    res.json({
      areas,
      types
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/restaurants/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM restaurants WHERE id = ?');
    const restaurant = stmt.get(id);
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/statistics/overview', (req, res) => {
  try {
    const totalRestaurants = db.prepare('SELECT COUNT(*) as count FROM restaurants').get().count;
    const totalAreas = db.prepare('SELECT COUNT(DISTINCT area) as count FROM restaurants').get().count;
    const totalTypes = db.prepare('SELECT COUNT(DISTINCT type_name) as count FROM restaurants').get().count;
    
    res.json({
      totalRestaurants,
      totalAreas,
      totalTypes
    });
  } catch (error) {
    console.error('Error fetching overview statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/statistics', (req, res) => {
  try {
    const { area } = req.query;
    
    let areaFilter = '';
    const params = [];
    
    if (area && area !== 'all') {
      areaFilter = 'WHERE area = ?';
      params.push(area);
    }

    const totalRestaurants = db.prepare(`SELECT COUNT(*) as count FROM restaurants ${areaFilter}`).get(...params).count;
    const totalAreas = db.prepare(`SELECT COUNT(DISTINCT area) as count FROM restaurants ${areaFilter}`).get(...params).count;
    const totalTypes = db.prepare(`SELECT COUNT(DISTINCT type_name) as count FROM restaurants ${areaFilter}`).get(...params).count;

    const areaDistribution = db.prepare(`
      SELECT area as name, COUNT(*) as count 
      FROM restaurants 
      GROUP BY area 
      ORDER BY count DESC
    `).all();

    const typeDistribution = db.prepare(`
      SELECT type_name as name, COUNT(*) as count 
      FROM restaurants 
      GROUP BY type_name 
      ORDER BY count DESC
    `).all();

    const ratingDistribution = db.prepare(`
      SELECT 
        CASE 
          WHEN rating >= 4.5 THEN '4.5-5.0'
          WHEN rating >= 4.0 THEN '4.0-4.4'
          WHEN rating >= 3.5 THEN '3.5-3.9'
          WHEN rating >= 3.0 THEN '3.0-3.4'
          ELSE '0-2.9'
        END as rating,
        COUNT(*) as count
      FROM restaurants 
      WHERE rating IS NOT NULL
      GROUP BY rating
      ORDER BY rating
    `).all();

    const priceDistribution = db.prepare(`
      SELECT 
        CASE 
          WHEN average_price >= 200 THEN '200+'
          WHEN average_price >= 100 THEN '100-199'
          WHEN average_price >= 50 THEN '50-99'
          WHEN average_price >= 20 THEN '20-49'
          ELSE '0-19'
        END as range,
        COUNT(*) as count
      FROM restaurants 
      WHERE average_price IS NOT NULL
      GROUP BY range
      ORDER BY range
    `).all();

    res.json({
      totalRestaurants,
      totalAreas,
      totalTypes,
      areaDistribution,
      typeDistribution,
      ratingDistribution,
      priceDistribution
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/areas', (req, res) => {
  try {
    const areas = db.prepare('SELECT DISTINCT area FROM restaurants ORDER BY area').all();
    res.json(areas.map(a => a.area));
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/types', (req, res) => {
  try {
    const types = db.prepare('SELECT DISTINCT type_name FROM restaurants ORDER BY type_name').all();
    res.json(types.map(t => t.type_name));
  } catch (error) {
    console.error('Error fetching types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 启动前确保数据已加载（云平台无持久化磁盘时自动从 CSV 导入）
ensureData().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});
