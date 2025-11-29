/**
 * POST /api/vast/generate
 * 生成 VAST XML 并存储到 Vercel Blob
 */

const { put } = require('@vercel/blob');
const { minify } = require('html-minifier-terser');

// ========================================
// Helper Functions
// ========================================

function replaceMacros(template, macros = {}) {
  if (!template) return '';
  
  let result = template;
  
  Object.entries(macros).forEach(([key, value]) => {
    const pattern = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(pattern, value || '');
  });
  
  return result;
}

function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return [hrs, mins, secs]
    .map(n => String(n).padStart(2, '0'))
    .join(':');
}

function escapeXml(str) {
  if (!str) return '';
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateVastOptions(options) {
  const errors = [];
  
  if (!options.videoUrl) {
    errors.push('视频 URL 为必填项');
  } else if (!isValidUrl(options.videoUrl)) {
    errors.push('视频 URL 格式无效');
  }
  
  if (options.duration !== undefined) {
    const dur = parseInt(options.duration, 10);
    if (isNaN(dur) || dur < 1 || dur > 3600) {
      errors.push('视频时长必须在 1-3600 秒之间');
    }
  }
  
  if (options.companionSize) {
    const { width, height } = options.companionSize;
    if (width && (width < 50 || width > 2000)) {
      errors.push('伴随广告宽度必须在 50-2000 之间');
    }
    if (height && (height < 50 || height > 2000)) {
      errors.push('伴随广告高度必须在 50-2000 之间');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

async function generateVastXml(options) {
  const {
    videoUrl,
    duration = 30,
    template = '',
    macros = {},
    companionSize = { width: 300, height: 250 },
    adId = 'companion-preview-ad',
    adTitle = 'Companion Ad Preview',
  } = options;

  const processedTemplate = replaceMacros(template, macros);
  
  let companionSection = '';
  
  if (processedTemplate) {
    const minifiedHtml = await minify(processedTemplate, {
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      removeComments: true,
      quoteCharacter: '"'
    });

    companionSection = `
        <Creative>
          <CompanionAds>
            <Companion id="companion-1" width="${companionSize.width}" height="${companionSize.height}">
              <HTMLResource>
                <![CDATA[${minifiedHtml}]]>
              </HTMLResource>
            </Companion>
          </CompanionAds>
        </Creative>`;
  }

  const vastXml = `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="4.2" xmlns="http://www.iab.com/VAST">
  <Ad id="${escapeXml(adId)}">
    <InLine>
      <AdSystem version="1.0">Companion Playground</AdSystem>
      <AdTitle>${escapeXml(adTitle)}</AdTitle>
      <Impression id="imp-1"><![CDATA[about:blank]]></Impression>
      <Creatives>
        <Creative id="creative-linear">
          <Linear>
            <Duration>${formatDuration(duration)}</Duration>
            <MediaFiles>
              <MediaFile id="media-1" delivery="progressive" type="video/mp4" width="1920" height="1080">
                <![CDATA[${videoUrl}]]>
              </MediaFile>
            </MediaFiles>
          </Linear>
        </Creative>${companionSection}
      </Creatives>
    </InLine>
  </Ad>
</VAST>`;

  return vastXml.trim();
}

// ========================================
// Generate UUID
// ========================================

function generateId() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ========================================
// API Handler
// ========================================

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
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
    // Generate companion ID
    const companionId = generateId();
    
    // Process template with macros
    const processedTemplate = replaceMacros(template, macros);
    
    // Generate VAST XML
    const vastXml = await generateVastXml({
      videoUrl,
      duration: parseInt(duration, 10),
      template: processedTemplate,
      macros: {},
      companionSize,
      adId,
      adTitle,
    });
    
    // Store VAST XML to Vercel Blob
    const { url: vastUrl } = await put(
      `vast/${companionId}.xml`,
      vastXml,
      { 
        access: 'public',
        contentType: 'application/xml',
      }
    );
    
    // Store companion HTML to Vercel Blob (if exists)
    let companionUrl = null;
    if (processedTemplate) {
      const companionHtml = `<!DOCTYPE html>
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
${processedTemplate}
</body>
</html>`;
      
      const { url } = await put(
        `companion/${companionId}.html`,
        companionHtml,
        { 
          access: 'public',
          contentType: 'text/html',
        }
      );
      companionUrl = url;
    }
    
    return res.status(200).json({
      success: true,
      vastXml,
      vastUrl,
      companionId,
      companionUrl,
    });
  } catch (error) {
    console.error('Error generating VAST:', error);
    return res.status(500).json({
      error: 'VAST generation failed',
      message: error.message,
    });
  }
};
