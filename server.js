/**
 * VAST Companion Ad Playground - Server
 * 独立的 Express 服务器
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { generateVastXml, validateVastOptions, replaceMacros } = require('./src/lib/vast-generator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS headers
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Static files - serve from src directory
app.use(express.static(path.join(__dirname, 'src')));

// In-memory storage for companion ads (temporary, for IMA SDK to fetch)
const companionStore = new Map();

// Cleanup old companions every 5 minutes
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  
  for (const [id, data] of companionStore) {
    if (now - data.createdAt > maxAge) {
      companionStore.delete(id);
    }
  }
}, 5 * 60 * 1000);

// ========================================
// API Routes
// ========================================

/**
 * GET /api/templates
 * 获取可用的伴随广告模板列表 (从 dist 目录读取)
 */
app.get('/api/templates', (req, res) => {
  // Read from src/dist directory
  const templatesDir = path.join(__dirname, 'src', 'dist');
  
  try {
    if (!fs.existsSync(templatesDir)) {
      // If dist doesn't exist, return empty list
      console.warn('Dist directory not found at:', templatesDir);
      return res.json([]);
    }
    
    const files = fs.readdirSync(templatesDir);
    const templates = files
      .filter(file => file.endsWith('.html'))
      .map(file => ({
        name: file,
        path: path.join(templatesDir, file),
      }));
    
    res.json(templates);
  } catch (error) {
    console.error('Error reading templates directory:', error);
    res.status(500).json({ error: 'Failed to read templates directory' });
  }
});

/**
 * GET /api/templates/:name
 * 获取指定模板的内容
 */
app.get('/api/templates/:name', (req, res) => {
  const templateName = req.params.name;
  const templatesDir = path.join(__dirname, 'src', 'dist');
  const templatePath = path.join(templatesDir, templateName);
  
  // Security check: ensure path is within templates directory
  if (!templatePath.startsWith(templatesDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const content = fs.readFileSync(templatePath, 'utf8');
    res.type('text/html').send(content);
  } catch (error) {
    console.error('Error reading template:', error);
    res.status(500).json({ error: 'Failed to read template' });
  }
});

/**
 * POST /api/vast/generate
 * 生成 VAST XML
 */
app.post('/api/vast/generate', async (req, res) => {
  const {
    videoUrl,
    duration = 30,
    template = '',
    macros = {},
    companionSize = { width: 300, height: 250 },
    adId,
    adTitle,
  } = req.body;
  
  // Validate options
  const validation = validateVastOptions({ videoUrl, duration, companionSize });
  
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation failed',
      message: validation.errors.join('; '),
      errors: validation.errors,
    });
  }
  
  try {
    // Generate companion ID for IMA SDK to fetch
    const companionId = uuidv4();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Store processed companion HTML (Runtime macro replacement)
    const processedTemplate = replaceMacros(template, macros);
    
    companionStore.set(companionId, {
      html: processedTemplate,
      createdAt: Date.now(),
    });
    
    // Generate VAST XML
    const vastXml = await generateVastXml({
      videoUrl,
      duration: parseInt(duration, 10),
      template: processedTemplate,
      macros: {}, // Macros already replaced
      companionSize,
      adId,
      adTitle,
      companionId,
      baseUrl,
    });
    
    // Generate VAST URL for IMA SDK
    const vastUrl = `${baseUrl}/api/vast/${companionId}.xml`;
    
    // Store VAST XML for fetching
    companionStore.set(`vast-${companionId}`, {
      xml: vastXml,
      createdAt: Date.now(),
    });
    
    res.json({
      success: true,
      vastXml,
      vastUrl,
      companionId,
    });
  } catch (error) {
    console.error('Error generating VAST:', error);
    res.status(500).json({
      error: 'VAST generation failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/vast/:id.xml
 * 获取生成的 VAST XML（供 IMA SDK 请求）
 */
app.get('/api/vast/:id.xml', (req, res) => {
  const id = req.params.id;
  const data = companionStore.get(`vast-${id}`);
  
  if (!data) {
    return res.status(404).type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<VAST version="4.2">
  <Error><![CDATA[VAST not found]]></Error>
</VAST>`);
  }
  
  res.type('application/xml').send(data.xml);
});

/**
 * GET /api/vast/companion/:id
 * 获取处理后的伴随广告 HTML（供 IMA SDK IFrame 加载）
 */
app.get('/api/vast/companion/:id', (req, res) => {
  const id = req.params.id;
  const data = companionStore.get(id);
  
  if (!data) {
    return res.status(404).send('<p>Companion ad not found</p>');
  }
  
  // Wrap in full HTML document for iframe
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 100%; height: 100vh; overflow: hidden; }
  </style>
</head>
<body>
${data.html}
</body>
</html>`;
  
  res.type('text/html').send(html);
});

/**
 * GET /api/health
 * 健康检查
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    companionStoreSize: companionStore.size,
  });
});

// ========================================
// Start Server
// ========================================

app.listen(PORT, () => {
  console.log('');
  console.log('🎬 VAST Companion Ad Playground');
  console.log('================================');
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Playground URL: http://localhost:${PORT}/`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
  
  // Open browser automatically logic removed
});
