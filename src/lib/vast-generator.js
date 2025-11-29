/**
 * VAST XML Generator
 * 生成 VAST 4.2 格式的 XML
 */

/**
 * 替换模板中的宏变量
 * @param {string} template - HTML 模板
 * @param {Object} macros - 宏变量键值对
 * @returns {string} 替换后的 HTML
 */
function replaceMacros(template, macros = {}) {
  if (!template) return '';
  
  let result = template;
  
  Object.entries(macros).forEach(([key, value]) => {
    const pattern = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(pattern, value || '');
  });
  
  return result;
}

/**
 * 将秒数转换为 VAST 时长格式 (HH:MM:SS)
 * @param {number} seconds - 秒数
 * @returns {string} VAST 时长格式
 */
function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return [hrs, mins, secs]
    .map(n => String(n).padStart(2, '0'))
    .join(':');
}

/**
 * 转义 XML 特殊字符
 * @param {string} str - 原始字符串
 * @returns {string} 转义后的字符串
 */
function escapeXml(str) {
  if (!str) return '';
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const { minify } = require('html-minifier-terser');

/**
 * 生成 VAST XML
 * @param {Object} options - 配置选项
 * ...
 * @returns {Promise<string>} VAST XML 字符串
 */
async function generateVastXml(options) {
  const {
    videoUrl,
    duration = 30,
    template = '',
    macros = {},
    companionSize = { width: 300, height: 250 },
    adId = 'companion-preview-ad',
    adTitle = 'Companion Ad Preview',
    companionId = '',
    baseUrl = '',
  } = options;

  // Replace macros in template
  const processedTemplate = replaceMacros(template, macros);
  
  // Build companion ad section
  let companionSection = '';
  
  if (processedTemplate) {
    // Minify HTML for VAST (compress to single line)
    const minifiedHtml = await minify(processedTemplate, {
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      removeComments: true,
      quoteCharacter: '"'
    });

    // Always use HTMLResource as requested
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

/**
 * 验证 VAST 生成参数
 * @param {Object} options - 配置选项
 * @returns {Object} { valid: boolean, errors: string[] }
 */
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

/**
 * 检查 URL 是否有效
 * @param {string} str - URL 字符串
 * @returns {boolean}
 */
function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

module.exports = {
  generateVastXml,
  validateVastOptions,
  replaceMacros,
  formatDuration,
  escapeXml,
};
