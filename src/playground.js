/**
 * VAST Companion Ad Playground
 * 伴随广告预览工具前端逻辑
 */

(function() {
  'use strict';

  // ========================================
  // Global State
  // ========================================
  
  const state = {
    currentTemplate: '',
    detectedMacros: [],
    macroValues: {},
    vastXml: '',
    companionSize: { width: 300, height: 250 },
    imaLoaded: false,
    adsManager: null,
    adsLoader: null,
    adDisplayContainer: null,
    isResizing: false,
    isDragging: false,
    dragPositions: {
      video: { x: 0, y: 0 },
      companion: { x: 0, y: 0 }
    },
    // Advanced Config State
    previewMode: 'simplified', // 'simplified' | 'full'
    contentVideoUrl: '',
    adBreakType: 'preroll', // 'preroll' | 'midroll' | 'postroll'
    midRollTime: 5,
    adPlayed: false, // Track if ad has played for midroll
    activeListeners: [] // Track event listeners on video element to clean up
  };

  const IAB_SIZES = [
    { width: 300, height: 250, label: 'Medium Rectangle' },
    { width: 728, height: 90, label: 'Leaderboard' },
    { width: 300, height: 600, label: 'Half Page' },
    { width: 160, height: 600, label: 'Wide Skyscraper' },
    { width: 320, height: 50, label: 'Mobile Leaderboard' },
    { width: 320, height: 480, label: 'Mobile Interstitial' },
    { width: 480, height: 320, label: 'Mobile Interstitial' },
  ];

  const SNAP_THRESHOLD = 15; // Pixels

  // ========================================
  // DOM Elements
  // ========================================
  
  const elements = {
    // Template Load Elements
    btnLoadFile: document.getElementById('btn-load-file'),
    fileInput: document.getElementById('file-input'),
    templateUrl: document.getElementById('template-url'),
    btnLoadUrl: document.getElementById('btn-load-url'),
    templateEditor: document.getElementById('template-editor'),
    macrosContainer: document.getElementById('macros-container'),
    macrosList: document.getElementById('macros-list'),
    
    // Video Config
    videoUrl: document.getElementById('video-url'),
    videoDuration: document.getElementById('video-duration'),
    
    // Size Config
    sizePreset: document.getElementById('size-preset'),
    customSizeGroup: document.getElementById('custom-size-group'),
    customWidth: document.getElementById('custom-width'),
    customHeight: document.getElementById('custom-height'),
    
    // Action Buttons
    btnGenerateVast: document.getElementById('btn-generate-vast'),
    btnPreview: document.getElementById('btn-preview'),
    btnCopyVast: document.getElementById('btn-copy-vast'),
    
    // Preview Elements
    previewFrame: document.getElementById('preview-frame'),
    previewSizeLabel: document.getElementById('preview-size-label'),
    vastXmlContent: document.getElementById('vast-xml-content'),
    
    videoPlayerWrapper: document.querySelector('.video-player-wrapper'),
    videoContainer: document.getElementById('video-container'),
    contentVideo: document.getElementById('content-video'),
    adContainer: document.getElementById('ad-container'),
    
    companionSlotWrapper: document.querySelector('.companion-slot-wrapper'),
    companionSlotContainer: document.getElementById('companion-slot-container'),
    companionResizableWrapper: document.getElementById('companion-resizable-wrapper'),
    companionSlot: document.getElementById('companion-slot'),
    
    resizeHandles: document.querySelectorAll('.resize-handle'),
    resizeIndicator: document.querySelector('.resize-indicator'),
    statusMessage: document.getElementById('status-message'),
    imaStatus: document.getElementById('ima-status'),
    toast: document.getElementById('toast'),
    tabs: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Advanced Config Elements
    previewModeRadios: document.getElementsByName('preview-mode'),
    fullModeOptions: document.getElementById('full-mode-options'),
    contentVideoUrlInput: document.getElementById('content-video-url'),
    adBreakTypeSelect: document.getElementById('ad-break-type'),
    midRollTimeGroup: document.getElementById('midroll-time-group'),
    midRollTimeInput: document.getElementById('midroll-time'),
  };

  // ========================================
  // Initialization
  // ========================================
  
  function init() {
    setupEventListeners();
    initResizeLogic();
    initDragMoveLogic();
    checkImaSDK();
    updateCompanionSize();
    initAdvancedConfig();
    setStatus('就绪');
  }

  function initAdvancedConfig() {
    state.contentVideoUrl = elements.contentVideoUrlInput.value;
    state.adBreakType = elements.adBreakTypeSelect.value;
    state.midRollTime = parseInt(elements.midRollTimeInput.value, 10);
  }

  // ========================================
  // Template Management
  // ========================================
  
  /**
   * 从本地文件加载模板
   */
  function loadTemplateFromFile(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      elements.templateEditor.value = content;
      state.currentTemplate = content;
      detectMacros(content);
      setStatus(`已加载文件: ${file.name}`);
      showToast(`已加载: ${file.name}`, 'success');
    };
    reader.onerror = () => {
      showToast('文件读取失败', 'error');
    };
    reader.readAsText(file);
  }

  /**
   * 从 URL 加载模板
   */
  async function loadTemplateFromUrl(url) {
    if (!url) {
      showToast('请输入模板 URL', 'error');
      return;
    }
    
    try {
      setStatus('加载模板中...');
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const content = await response.text();
      elements.templateEditor.value = content;
      state.currentTemplate = content;
      detectMacros(content);
      setStatus('模板加载成功');
      showToast('模板加载成功', 'success');
    } catch (error) {
      console.error('Error loading template from URL:', error);
      
      // Check if it's likely a CORS error
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        showToast('加载失败：目标服务器不允许跨域访问，请下载文件后使用「选择文件」功能', 'error');
      } else {
        showToast(`加载失败: ${error.message}`, 'error');
      }
      setStatus('模板加载失败');
    }
  }

  // ========================================
  // Macro Detection & Management
  // ========================================
  
  function detectMacros(content) {
    const macroPattern = /\{([A-Z][A-Z0-9_]*)\}/g;
    const macros = new Set();
    let match;
    
    while ((match = macroPattern.exec(content)) !== null) {
      macros.add(match[1]);
    }
    
    state.detectedMacros = Array.from(macros).sort();
    renderMacroInputs();
  }

  function renderMacroInputs() {
    const { detectedMacros, macroValues } = state;
    
    if (detectedMacros.length === 0) {
      elements.macrosContainer.style.display = 'none';
      return;
    }
    
    elements.macrosContainer.style.display = 'block';
    elements.macrosList.innerHTML = '';
    
    const defaultValues = {
      'LANDING_URL': 'https://example.com/landing',
      'BRAND_VIDEO_URL': elements.videoUrl.value,
      'OVERLAY_LANDING_URL': 'https://example.com/overlay',
      'BRAND_LOGO': 'https://via.placeholder.com/100x100',
      'BRAND_NAME': 'Brand Name',
      'COMPANION_IMAGE_URL': 'https://via.placeholder.com/300x250',
      'COMPANION_TITLE': 'Companion Ad Title',
      'COMPANION_DESCRIPTION': 'This is a companion ad description.',
      'COMPANION_CTA_TEXT': 'Learn More',
      'BID_ID': 'test-bid-123',
      'TRACKER_SDK_URL': '',
    };
    
    detectedMacros.forEach(macro => {
      const div = document.createElement('div');
      div.className = 'macro-item';
      
      const label = document.createElement('label');
      label.textContent = `{${macro}}`;
      
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = `${macro} 的值`;
      input.value = macroValues[macro] || defaultValues[macro] || '';
      input.dataset.macro = macro;
      
      input.addEventListener('input', (e) => {
        state.macroValues[macro] = e.target.value;
      });
      
      state.macroValues[macro] = input.value;
      
      div.appendChild(label);
      div.appendChild(input);
      elements.macrosList.appendChild(div);
    });
  }

  // ========================================
  // VAST Generation
  // ========================================
  
  async function generateVast() {
    const template = elements.templateEditor.value.trim();
    const videoUrl = elements.videoUrl.value.trim();
    const duration = parseInt(elements.videoDuration.value, 10) || 30;
    
    if (!videoUrl) {
      showToast('请输入广告视频 URL', 'error');
      return null;
    }
    
    try {
      setStatus('生成 VAST XML...');
      
      const response = await fetch('/api/vast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          videoUrl,
          duration,
          macros: state.macroValues,
          companionSize: state.companionSize,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'VAST generation failed');
      }
      
      const data = await response.json();
      state.vastXml = data.vastXml;
      
      displayVastXml(data.vastXml);
      setStatus('VAST XML 生成成功');
      showToast('VAST XML 生成成功', 'success');
      
      return data;
    } catch (error) {
      console.error('Error generating VAST:', error);
      showToast(`VAST 生成失败: ${error.message}`, 'error');
      setStatus('VAST 生成失败', 'error');
      return null;
    }
  }

  function displayVastXml(xml) {
    const highlighted = xml
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(&lt;\/?[a-zA-Z][a-zA-Z0-9]*)/g, '<span class="xml-tag">$1</span>')
      .replace(/(\s)([a-zA-Z][a-zA-Z0-9-]*)=/g, '$1<span class="xml-attr">$2</span>=')
      .replace(/"([^"]*)"/g, '"<span class="xml-value">$1</span>"')
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="xml-comment">$1</span>');
    
    elements.vastXmlContent.innerHTML = highlighted;
  }

  // ========================================
  // IMA SDK Integration
  // ========================================
  
  function checkImaSDK() {
    const MAX_RETRIES = 10;
    let retries = 0;

    function attemptCheck() {
      if (typeof google !== 'undefined' && google.ima) {
        state.imaLoaded = true;
        elements.imaStatus.textContent = 'IMA SDK: 已加载';
        elements.imaStatus.classList.remove('error');
        elements.imaStatus.classList.add('loaded');
        initImaSDK();
      } else {
        retries++;
        if (retries < MAX_RETRIES) {
          elements.imaStatus.textContent = `IMA SDK: 加载中... (${retries}/${MAX_RETRIES})`;
          setTimeout(attemptCheck, 1000);
        } else {
          elements.imaStatus.textContent = 'IMA SDK: 加载被拦截或失败';
          elements.imaStatus.classList.add('error');
          
          const msg = 'IMA SDK 加载失败。如果是 "ERR_BLOCKED_BY_CLIENT"，请尝试关闭广告拦截插件 (AdBlock 等)。将使用降级模式。';
          console.warn(msg);
          showToast(msg, 'warning');
        }
      }
    }

    attemptCheck();
  }

  function initImaSDK() {
    if (!state.imaLoaded) return;
    
    try {
      // Create ad display container
      state.adDisplayContainer = new google.ima.AdDisplayContainer(
        elements.adContainer,
        elements.contentVideo
      );
      
      // Create ads loader
      state.adsLoader = new google.ima.AdsLoader(state.adDisplayContainer);
      
      // Add event listeners
      state.adsLoader.addEventListener(
        google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        onAdsManagerLoaded,
        false
      );
      
      state.adsLoader.addEventListener(
        google.ima.AdErrorEvent.Type.AD_ERROR,
        onAdError,
        false
      );
      
      console.log('IMA SDK initialized successfully');
    } catch (error) {
      console.error('Error initializing IMA SDK:', error);
      state.imaLoaded = false;
      elements.imaStatus.textContent = 'IMA SDK: 初始化失败';
      elements.imaStatus.classList.remove('loaded');
      elements.imaStatus.classList.add('error');
    }
  }

  function onAdsManagerLoaded(adsManagerLoadedEvent) {
    const adsRenderingSettings = new google.ima.AdsRenderingSettings();
    adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
    
    state.adsManager = adsManagerLoadedEvent.getAdsManager(
      elements.contentVideo,
      adsRenderingSettings
    );
    
    state.adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, onContentPauseRequested);
    state.adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, onContentResumeRequested);
    state.adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, onAllAdsCompleted);
    state.adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, onAdStarted);
    state.adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, onAdComplete);
    state.adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, onAdLoaded);
    state.adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
    
    try {
      const videoContainer = elements.videoContainer;
      state.adsManager.init(
        videoContainer.clientWidth,
        videoContainer.clientHeight,
        google.ima.ViewMode.NORMAL
      );
      
      state.adsManager.start();
      setStatus('广告播放中...');
    } catch (error) {
      console.error('Error starting ads:', error);
      showToast('广告启动失败', 'error');
    }
  }

  function onAdError(adErrorEvent) {
    console.error('Ad error:', adErrorEvent.getError());
    showToast(`广告错误: ${adErrorEvent.getError().getMessage()}`, 'error');
    setStatus('广告加载失败', 'error');
    
    if (state.adsManager) {
      state.adsManager.destroy();
      state.adsManager = null;
    }
    
    renderCompanionFallback();
  }

  function onContentPauseRequested() {
    elements.contentVideo.pause();
    setStatus('内容视频暂停 (广告插入)');
  }

  function onContentResumeRequested() {
    elements.contentVideo.play();
    setStatus('内容视频恢复播放');
  }

  function onAllAdsCompleted() {
    setStatus('所有广告播放完成');
    showToast('广告播放完成', 'success');
  }

  function onAdStarted(adEvent) {
    const ad = adEvent.getAd();
    setStatus(`广告播放中: ${ad.getTitle() || '未命名广告'}`);
    renderCompanionAds(ad);
  }

  function onAdLoaded(adEvent) {
    console.log('Ad loaded:', adEvent);
  }

  function onAdComplete() {
    setStatus('单个广告播放完成');
  }

  function renderCompanionAds(ad) {
    console.log('Attempting to render companion ads...');
    console.log('Requested size:', state.companionSize);

    const selectionSettings = new google.ima.CompanionAdSelectionSettings();
    selectionSettings.resourceType = google.ima.CompanionAdSelectionSettings.ResourceType.HTML;
    selectionSettings.creativeType = google.ima.CompanionAdSelectionSettings.CreativeType.ALL;
    selectionSettings.sizeCriteria = google.ima.CompanionAdSelectionSettings.SizeCriteria.IGNORE;

    let companionAds = ad.getCompanionAds(
      state.companionSize.width,
      state.companionSize.height,
      selectionSettings
    );
    
    console.log(`Found ${companionAds.length} companion ads (Method 1)`);

    if (!companionAds || companionAds.length === 0) {
      console.log('Method 1 failed, trying loose matching...');
      companionAds = ad.getCompanionAds(0, 0);
      console.log(`Found ${companionAds.length} companion ads (Method 2)`);
    }
    
    if (companionAds && companionAds.length > 0) {
      const companion = companionAds[0];
      const content = companion.getContent();
      renderContentInIframe(content);
    } else {
      console.warn('No companion ads found via IMA SDK after all attempts');
      renderCompanionFallback();
    }
  }

  function renderContentInIframe(htmlContent) {
    elements.companionSlot.innerHTML = '';
    
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
    iframe.setAttribute('sandbox', 'allow-forms allow-popups allow-scripts allow-same-origin');
    
    elements.companionSlot.appendChild(iframe);
    
    setTimeout(() => {
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(htmlContent);
      
      const style = doc.createElement('style');
      style.textContent = 'body { margin: 0; padding: 0; overflow: hidden; }';
      (doc.head || doc.body || doc.documentElement).appendChild(style);
      
      doc.close();
    }, 0);
  }

  function renderCompanionFallback() {
    const template = elements.templateEditor.value.trim();
    if (!template) {
      elements.companionSlot.innerHTML = '<div class="companion-placeholder"><p>无伴随广告内容</p></div>';
      return;
    }
    
    let html = template;
    Object.entries(state.macroValues).forEach(([macro, value]) => {
      html = html.replace(new RegExp(`\\{${macro}\\}`, 'g'), value);
    });
    
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
    iframe.srcdoc = html;
    
    elements.companionSlot.innerHTML = '';
    elements.companionSlot.appendChild(iframe);
    
    console.log('Companion rendered via fallback (iframe)');
  }

  // ========================================
  // Preview Management
  // ========================================

  function cleanupPreview() {
    // 1. Stop and destroy ads manager
    if (state.adsManager) {
      state.adsManager.destroy();
      state.adsManager = null;
    }
    
    // 2. Clear companion slot
    elements.companionSlot.innerHTML = '<div class="companion-placeholder"><p>加载中...</p></div>';
    
    // 3. Reset video element
    const video = elements.contentVideo;
    video.pause();
    video.currentTime = 0;
    // Remove src to stop buffering previous content
    video.removeAttribute('src');
    video.load();

    // 4. Remove event listeners for content video
    if (state.activeListeners.length > 0) {
      state.activeListeners.forEach(({ type, fn }) => {
        video.removeEventListener(type, fn);
      });
      state.activeListeners = [];
    }
    
    state.adPlayed = false;
  }
  
  async function startPreview() {
    const result = await generateVast();
    if (!result) return;
    
    cleanupPreview();
    
    if (!state.imaLoaded) {
      showToast('IMA SDK 不可用，使用降级预览', 'error');
      renderCompanionFallback();
      return;
    }

    if (state.adDisplayContainer) {
      state.adDisplayContainer.initialize();
    }
    
    switchTab('preview');

    if (state.previewMode === 'simplified') {
      startSimplifiedPreview(result.vastUrl);
    } else {
      startFullPreview(result.vastUrl);
    }
  }

  function requestAdsFromUrl(vastUrl) {
    if (!state.adsLoader) return;
    
    const adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl = vastUrl;
    
    const videoContainer = elements.videoContainer;
    adsRequest.linearAdSlotWidth = videoContainer.clientWidth;
    adsRequest.linearAdSlotHeight = videoContainer.clientHeight;
    
    adsRequest.nonLinearAdSlotWidth = state.companionSize.width;
    adsRequest.nonLinearAdSlotHeight = state.companionSize.height;
    
    try {
      state.adsLoader.requestAds(adsRequest);
      setStatus('请求广告中...');
    } catch (error) {
      console.error('Error requesting ads:', error);
      showToast('广告请求失败', 'error');
      renderCompanionFallback();
    }
  }

  function startSimplifiedPreview(vastUrl) {
    // Simplified mode: Just request ads, let SDK use the video element
    requestAdsFromUrl(vastUrl);
  }

  function startFullPreview(vastUrl) {
    const video = elements.contentVideo;
    if (!state.contentVideoUrl) {
      showToast('请输入内容视频 URL', 'error');
      return;
    }
    
    video.src = state.contentVideoUrl;
    video.load();
    
    setStatus('准备播放内容视频...');
    
    const triggerAds = () => {
      console.log('Triggering ads for break:', state.adBreakType);
      requestAdsFromUrl(vastUrl);
    };

    if (state.adBreakType === 'preroll') {
      // Pre-roll: Trigger immediately
      triggerAds();
      // Note: We don't explicitly play video here, SDK should start and when done play content?
      // Actually, if we request ads, SDK will initialize and play ad. 
      // When ad finishes, CONTENT_RESUME_REQUESTED fires -> we play content.
      // But we need to make sure SDK knows we have content.
      // Since we initialized AdDisplayContainer with elements.contentVideo, it knows.
    } else if (state.adBreakType === 'midroll') {
      // Mid-roll
      video.play().catch(e => console.error('Autoplay failed', e));
      
      const onTimeUpdate = () => {
        // Use 1s window
        if (!state.adPlayed && video.currentTime >= state.midRollTime) {
          state.adPlayed = true;
          console.log('Mid-roll point reached');
          // Pause content (SDK might do this when ad starts, but requesting takes time)
          // We don't pause here, we let SDK events handle it for smoothness
          triggerAds();
        }
      };
      
      video.addEventListener('timeupdate', onTimeUpdate);
      state.activeListeners.push({ type: 'timeupdate', fn: onTimeUpdate });
      
    } else if (state.adBreakType === 'postroll') {
      // Post-roll
      video.play().catch(e => console.error('Autoplay failed', e));
      
      const onEnded = () => {
        console.log('Content ended (Post-roll trigger)');
        triggerAds();
      };
      
      video.addEventListener('ended', onEnded);
      state.activeListeners.push({ type: 'ended', fn: onEnded });
    }
  }

  function updateCompanionSize() {
    const preset = elements.sizePreset.value;
    
    if (preset === 'custom') {
      elements.customSizeGroup.style.display = 'block';
      const w = parseInt(elements.customWidth.value, 10) || 300;
      const h = parseInt(elements.customHeight.value, 10) || 250;
      state.companionSize = { width: w, height: h };
    } else {
      elements.customSizeGroup.style.display = 'none';
      const [w, h] = preset.split('x').map(Number);
      state.companionSize = { width: w, height: h };
    }
    
    elements.companionResizableWrapper.style.width = `${state.companionSize.width}px`;
    elements.companionResizableWrapper.style.height = `${state.companionSize.height}px`;
    elements.previewSizeLabel.textContent = `${state.companionSize.width} × ${state.companionSize.height}`;
  }

  // ========================================
  // Helper: Iframe Pointer Events Control
  // ========================================
  function setIframesPointerEvents(enable) {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      iframe.style.pointerEvents = enable ? 'auto' : 'none';
    });
  }

  // ========================================
  // Drag & Move Logic (Modules)
  // ========================================
  function initDragMoveLogic() {
    const draggables = [
      { 
        key: 'video',
        wrapper: elements.videoPlayerWrapper,
        handle: elements.videoPlayerWrapper.querySelector('h3') 
      },
      { 
        key: 'companion',
        wrapper: elements.companionSlotWrapper,
        handle: elements.companionSlotWrapper.querySelector('h3')
      }
    ];

    draggables.forEach(({ key, wrapper, handle }) => {
      if (!handle) return;

      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        setIframesPointerEvents(false);
        state.isDragging = true;
        
        const startX = e.clientX;
        const startY = e.clientY;
        const initialPosX = state.dragPositions[key].x;
        const initialPosY = state.dragPositions[key].y;
        
        wrapper.style.zIndex = '1000';
        wrapper.querySelector('h3').style.cursor = 'grabbing';

        function onMove(e) {
          if (!state.isDragging) return;
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          wrapper.style.transform = `translate(${initialPosX + dx}px, ${initialPosY + dy}px)`;
        }

        function onStop(e) {
          if (!state.isDragging) return;
          state.isDragging = false;
          setIframesPointerEvents(true);
          wrapper.style.zIndex = '';
          wrapper.querySelector('h3').style.cursor = 'grab';
          
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          
          state.dragPositions[key].x = initialPosX + dx;
          state.dragPositions[key].y = initialPosY + dy;
          wrapper.style.transform = `translate(${state.dragPositions[key].x}px, ${state.dragPositions[key].y}px)`;
          
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onStop);
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onStop);
      });
    });
  }

  // ========================================
  // Resize Logic (Drag & Snap)
  // ========================================
  function initResizeLogic() {
    let startX, startY, startWidth, startHeight;
    let currentHandle = null;

    elements.resizeHandles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        setIframesPointerEvents(false);
        startDrag(e, handle);
      });
    });

    function startDrag(e, handle) {
      state.isResizing = true;
      currentHandle = handle.dataset.direction;
      
      startX = e.clientX;
      startY = e.clientY;
      startWidth = elements.companionResizableWrapper.offsetWidth;
      startHeight = elements.companionResizableWrapper.offsetHeight;
      
      elements.companionResizableWrapper.classList.add('resizing');
      handle.classList.add('dragging');
      
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', stopDrag);
    }

    function onDrag(e) {
      if (!state.isResizing) return;
      let newWidth = startWidth;
      let newHeight = startHeight;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      if (currentHandle === 'e' || currentHandle === 'se') newWidth = startWidth + deltaX;
      if (currentHandle === 's' || currentHandle === 'se') newHeight = startHeight + deltaY;
      
      const snapResult = calculateSnap(newWidth, newHeight, currentHandle);
      newWidth = Math.max(50, Math.min(snapResult.width, 2000));
      newHeight = Math.max(50, Math.min(snapResult.height, 2000));
      
      elements.companionResizableWrapper.style.width = `${newWidth}px`;
      elements.companionResizableWrapper.style.height = `${newHeight}px`;
      
      elements.resizeIndicator.textContent = `${newWidth} × ${newHeight}${snapResult.snapped ? ' (吸附)' : ''}`;
      elements.previewSizeLabel.textContent = `${newWidth} × ${newHeight}`;
    }

    function stopDrag(e) {
      if (!state.isResizing) return;
      state.isResizing = false;
      setIframesPointerEvents(true);
      elements.companionResizableWrapper.classList.remove('resizing');
      document.querySelectorAll('.resize-handle').forEach(h => h.classList.remove('dragging'));
      
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', stopDrag);
      
      const finalWidth = elements.companionResizableWrapper.offsetWidth;
      const finalHeight = elements.companionResizableWrapper.offsetHeight;
      updateStateWithNewSize(finalWidth, finalHeight);
    }

    function calculateSnap(w, h, direction) {
      let snappedW = w;
      let snappedH = h;
      let snapped = false;
      for (const size of IAB_SIZES) {
        if ((direction === 'e' || direction === 'se') && Math.abs(w - size.width) < SNAP_THRESHOLD) {
          snappedW = size.width;
          snapped = true;
        }
        if ((direction === 's' || direction === 'se') && Math.abs(h - size.height) < SNAP_THRESHOLD) {
          snappedH = size.height;
          snapped = true;
        }
      }
      return { width: snappedW, height: snappedH, snapped };
    }
  }

  function updateStateWithNewSize(width, height) {
    state.companionSize = { width, height };
    elements.customWidth.value = width;
    elements.customHeight.value = height;
    elements.sizePreset.value = 'custom';
    elements.customSizeGroup.style.display = 'block';
    
    const matchedPreset = IAB_SIZES.find(s => s.width === width && s.height === height);
    if (matchedPreset) {
      const option = Array.from(elements.sizePreset.options).find(opt => opt.value === `${width}x${height}`);
      if (option) {
        elements.sizePreset.value = option.value;
        elements.customSizeGroup.style.display = 'none';
      }
    }
  }

  // ========================================
  // Event Listeners
  // ========================================
  
  function setupEventListeners() {
    // Template Load Events
    elements.btnLoadFile.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) loadTemplateFromFile(file);
      e.target.value = ''; // Reset for same file selection
    });
    elements.btnLoadUrl.addEventListener('click', () => loadTemplateFromUrl(elements.templateUrl.value.trim()));
    elements.templateUrl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        loadTemplateFromUrl(elements.templateUrl.value.trim());
      }
    });
    
    let debounceTimer;
    elements.templateEditor.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => detectMacros(e.target.value), 300);
    });
    
    elements.sizePreset.addEventListener('change', updateCompanionSize);
    elements.customWidth.addEventListener('input', updateCompanionSize);
    elements.customHeight.addEventListener('input', updateCompanionSize);
    
    elements.btnGenerateVast.addEventListener('click', async () => {
      await generateVast();
      switchTab('vast-xml');
    });
    
    elements.btnPreview.addEventListener('click', startPreview);
    elements.btnCopyVast.addEventListener('click', async () => {
      if (!state.vastXml) return showToast('请先生成 VAST XML', 'error');
      await navigator.clipboard.writeText(state.vastXml);
      showToast('已复制', 'success');
    });
    
    elements.tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
    
    elements.videoUrl.addEventListener('input', () => {
      if (state.macroValues['BRAND_VIDEO_URL'] !== undefined) {
        state.macroValues['BRAND_VIDEO_URL'] = elements.videoUrl.value;
        const input = elements.macrosList.querySelector('[data-macro="BRAND_VIDEO_URL"]');
        if (input) input.value = elements.videoUrl.value;
      }
    });

    // Advanced Config Listeners
    Array.from(elements.previewModeRadios).forEach(radio => {
      radio.addEventListener('change', (e) => {
        state.previewMode = e.target.value;
        elements.fullModeOptions.style.display = state.previewMode === 'full' ? 'block' : 'none';
      });
    });

    elements.contentVideoUrlInput.addEventListener('input', (e) => state.contentVideoUrl = e.target.value);
    
    elements.adBreakTypeSelect.addEventListener('change', (e) => {
      state.adBreakType = e.target.value;
      elements.midRollTimeGroup.style.display = state.adBreakType === 'midroll' ? 'block' : 'none';
    });
    
    elements.midRollTimeInput.addEventListener('input', (e) => state.midRollTime = parseInt(e.target.value, 10));
  }

  function switchTab(tabId) {
    elements.tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabId));
    elements.tabContents.forEach(content => content.classList.toggle('active', content.id === `tab-${tabId}`));
  }
  
  function setStatus(msg) { elements.statusMessage.textContent = msg; }
  function showToast(msg, type = 'info') {
    elements.toast.textContent = msg;
    elements.toast.className = `toast ${type} show`;
    setTimeout(() => elements.toast.classList.remove('show'), 3000);
  }

  // ========================================
  // Start Application
  // ========================================
  
  document.addEventListener('DOMContentLoaded', init);
})();
