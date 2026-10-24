/**
 * FERRO DESIGN™ — ПОЛНЫЙ ДВИЖОК АДМИН-ПАНЕЛИ (ADMIN.JS)
 * Архитектурный минимализм, строгая валидация по 10 правилам verify_all_cases.py,
 * авто-конвертация рендеров в WebP, генерация HTML/XML и публикация через GitHub Git Trees API.
 */

// ============================================================
// 1. СОСТОЯНИЕ ПРИЛОЖЕНИЯ И ИНИЦИАЛИЗАЦИЯ
// ============================================================

window.AdminState = {
  data: null,
  activeTab: 'tab-texts',
  activeTextPage: 'page-home',
  activeProjectId: 'project-makarovsky',
  githubToken: localStorage.getItem('ferro_gh_token') || '',
  githubRepo: localStorage.getItem('ferro_gh_repo') || 'refunde/FERRO_DESIGN_WEB',
  githubBranch: localStorage.getItem('ferro_gh_branch') || 'main',
  publishLockUntil: parseInt(localStorage.getItem('ferro_publish_lock_until') || '0', 10),
  // Локальный реестр вновь загруженных файлов: virtualPath -> { blob, dataUrl, base64 }
  newFilesMap: new Map()
};

document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initModals();
  initPublishLockCountdown();
  initZipExport();
  await loadSiteContent();
});

// Уведомления (Toasts)
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : ''}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 260);
  }, 3800);
}

// ------------------------------------------------------------
// НАВИГАЦИЯ ПО ВКЛАДКАМ И СТРАНИЦАМ
// ------------------------------------------------------------
function initNavigation() {
  const tabBtns = document.querySelectorAll('.nav-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      const activePane = document.getElementById(tabId);
      if (activePane) activePane.classList.add('active');
      window.AdminState.activeTab = tabId;
    });
  });

  const subtabBtns = document.querySelectorAll('.subtab-btn');
  subtabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const pageId = btn.dataset.page;
      subtabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.text-page-view').forEach(v => v.classList.remove('active'));
      const activeView = document.getElementById(pageId);
      if (activeView) activeView.classList.add('active');
      window.AdminState.activeTextPage = pageId;
    });
  });
}

// ------------------------------------------------------------
// МОДАЛЬНЫЕ ОКНА И НАСТРОЙКИ GITHUB
// ------------------------------------------------------------
function initModals() {
  document.getElementById('btnOpenGithubModal').addEventListener('click', () => openModal('modalGithub'));
  document.getElementById('btnOpenPreviewModal').addEventListener('click', () => {
    const selector = document.getElementById('previewPageSelector');
    openLivePreview(selector ? selector.value : 'index.html');
    openModal('modalPreview');
  });
  document.getElementById('btnPublishSite').addEventListener('click', () => {
    if (isPublishLocked()) {
      const remainingSec = Math.ceil((window.AdminState.publishLockUntil - Date.now()) / 1000);
      const mins = Math.floor(remainingSec / 60);
      const secs = remainingSec % 60;
      alert(`Публикация временно заблокирована для завершения деплоя на GitHub Pages.\nОсталось подождать: ${mins} мин ${secs} сек.`);
      return;
    }
    openModal('modalPublishConfirm');
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close-modal')));
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  // Переключение устройств в предпросмотре
  const deviceBtns = document.querySelectorAll('.device-toggle-btn');
  const previewIframe = document.getElementById('previewIframe');
  deviceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      deviceBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.device === 'mobile') {
        previewIframe.className = 'preview-iframe-mobile';
      } else {
        previewIframe.className = 'preview-iframe-desktop';
      }
    });
  });

  const pageSelector = document.getElementById('previewPageSelector');
  if (pageSelector) {
    pageSelector.addEventListener('change', () => {
      openLivePreview(pageSelector.value);
    });
  }

  // GitHub Settings
  const tokenInput = document.getElementById('ghTokenInput');
  const repoInput = document.getElementById('ghRepoInput');
  const branchInput = document.getElementById('ghBranchInput');
  tokenInput.value = window.AdminState.githubToken;
  repoInput.value = window.AdminState.githubRepo;
  branchInput.value = window.AdminState.githubBranch;
  updateGithubStatusDot();

  document.getElementById('btnToggleTokenVisibility').addEventListener('click', function() {
    if (tokenInput.type === 'password') {
      tokenInput.type = 'text';
      this.textContent = 'Скрыть';
    } else {
      tokenInput.type = 'password';
      this.textContent = 'Показать';
    }
  });

  document.getElementById('btnSaveGithubSettings').addEventListener('click', () => {
    window.AdminState.githubToken = tokenInput.value.trim();
    window.AdminState.githubRepo = repoInput.value.trim();
    window.AdminState.githubBranch = branchInput.value.trim();
    localStorage.setItem('ferro_gh_token', window.AdminState.githubToken);
    localStorage.setItem('ferro_gh_repo', window.AdminState.githubRepo);
    localStorage.setItem('ferro_gh_branch', window.AdminState.githubBranch);
    updateGithubStatusDot();
    closeModal('modalGithub');
    showToast('Настройки GitHub успешно сохранены', 'success');
  });

  document.getElementById('btnTestGithubConnection').addEventListener('click', async () => {
    const statusBox = document.getElementById('ghConnectionStatusMessage');
    const token = tokenInput.value.trim();
    const repo = repoInput.value.trim();
    statusBox.style.display = 'block';
    statusBox.innerHTML = '<span style="color: var(--accent-amber);">Проверка подключения...</span>';

    if (!token) {
      statusBox.innerHTML = '<span style="color: var(--danger);">✕ Введите Personal Access Token</span>';
      return;
    }

    try {
      const res = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (res.ok) {
        const d = await res.json();
        statusBox.innerHTML = `<span style="color: var(--success);">✓ Связь установлена: ${d.full_name} (${d.default_branch})</span>`;
      } else {
        statusBox.innerHTML = `<span style="color: var(--danger);">✕ Ошибка подключения (${res.status} ${res.statusText})</span>`;
      }
    } catch (err) {
      statusBox.innerHTML = `<span style="color: var(--danger);">✕ Ошибка сети: ${err.message}</span>`;
    }
  });

  // Кнопка подтверждения публикации
  document.getElementById('btnConfirmPublishFinal').addEventListener('click', async () => {
    await handleSitePublication();
  });
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function updateGithubStatusDot() {
  const dot = document.getElementById('githubStatusDot');
  if (!dot) return;
  if (window.AdminState.githubToken) {
    dot.className = 'status-dot';
    dot.title = 'GitHub Token настроен';
  } else {
    dot.className = 'status-dot offline';
    dot.title = 'GitHub Token не настроен';
  }
}

// ------------------------------------------------------------
// 10-МИНУТНЫЙ ТАЙМЕР БЛОКИРОВКИ ПОВТОРНОЙ ПУБЛИКАЦИИ
// ------------------------------------------------------------
function isPublishLocked() {
  return window.AdminState.publishLockUntil > Date.now();
}

function initPublishLockCountdown() {
  const timerBadge = document.getElementById('publishLockTimerBadge');
  const publishBtn = document.getElementById('btnPublishSite');

  function tick() {
    const now = Date.now();
    if (window.AdminState.publishLockUntil > now) {
      const diffSec = Math.ceil((window.AdminState.publishLockUntil - now) / 1000);
      const mins = String(Math.floor(diffSec / 60)).padStart(2, '0');
      const secs = String(diffSec % 60).padStart(2, '0');
      if (timerBadge) {
        timerBadge.style.display = 'inline-block';
        timerBadge.textContent = `${mins}:${secs}`;
      }
      if (publishBtn) {
        publishBtn.style.opacity = '0.7';
        publishBtn.title = `Идет деплой на GitHub Pages (${mins}:${secs})`;
      }
    } else {
      if (timerBadge) timerBadge.style.display = 'none';
      if (publishBtn) {
        publishBtn.style.opacity = '1';
        publishBtn.title = 'Опубликовать сайт';
      }
    }
  }

  tick();
  setInterval(tick, 1000);
}


// ============================================================
// 2. МОДУЛЬ АВТО-КОНВЕРТАЦИИ WEBP И ЗАГРУЗКИ ФАЙЛОВ
// ============================================================

/**
 * Сжимает изображение в браузере через <canvas> в формат WebP (качество 0.86, max side 2560px)
 * @param {File|Blob} file
 * @returns {Promise<{blob: Blob, dataUrl: string, base64: string, width: number, height: number}>}
 */
async function compressAndConvertToWebP(file, maxSide = 2560, quality = 0.86) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Масштабирование до maxSide
        if (width > maxSide || height > maxSide) {
          if (width > height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas WebP blob conversion failed'));
            return;
          }
          const dataUrl = canvas.toDataURL('image/webp', quality);
          // Получаем чистый base64 без data:image/webp;base64,
          const base64 = dataUrl.split(',')[1];
          resolve({ blob, dataUrl, base64, width, height });
        }, 'image/webp', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Привязка дропзоны обложек и рендеров
 */
function setupDropzonesForProject(proj) {
  // 1. Дневная обложка
  const dayInput = document.getElementById('inputDayCoverFile');
  const dayZone = document.getElementById('dropzoneDayCover');
  if (dayInput && dayZone) {
    dayZone.onclick = () => dayInput.click();
    dayZone.ondragover = (e) => { e.preventDefault(); dayZone.classList.add('dragover'); };
    dayZone.ondragleave = () => dayZone.classList.remove('dragover');
    dayZone.ondrop = async (e) => {
      e.preventDefault();
      dayZone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        await handleDayCoverUpload(proj, e.dataTransfer.files[0]);
      }
    };
    dayInput.onchange = async () => {
      if (dayInput.files.length > 0) {
        await handleDayCoverUpload(proj, dayInput.files[0]);
      }
    };
  }

  // 2. Ночная обложка
  const nightInput = document.getElementById('inputNightCoverFile');
  const nightZone = document.getElementById('dropzoneNightCover');
  if (nightInput && nightZone) {
    nightZone.onclick = () => nightInput.click();
    nightZone.ondragover = (e) => { e.preventDefault(); nightZone.classList.add('dragover'); };
    nightZone.ondragleave = () => nightZone.classList.remove('dragover');
    nightZone.ondrop = async (e) => {
      e.preventDefault();
      nightZone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        await handleNightCoverUpload(proj, e.dataTransfer.files[0]);
      }
    };
    nightInput.onchange = async () => {
      if (nightInput.files.length > 0) {
        await handleNightCoverUpload(proj, nightInput.files[0]);
      }
    };
  }
}

async function handleDayCoverUpload(proj, file) {
  try {
    showToast('Конвертация дневной обложки в WebP...', 'info');
    const result = await compressAndConvertToWebP(file);
    const targetPath = `images/${proj.folder}/cover.webp`;
    window.AdminState.newFilesMap.set(targetPath, result);

    proj.heroDay = targetPath;
    proj.cardImage = targetPath;

    document.getElementById('dayCoverImgPreview').src = result.dataUrl;
    document.getElementById('dayCoverPath').textContent = targetPath;
    document.getElementById('dayCoverName').textContent = 'cover.webp';
    renderProjectsSidebar(window.AdminState.data.projects);
    renderTab2Reorder(window.AdminState.data);
    showToast('Дневная обложка успешно обновлена в WebP!', 'success');
  } catch (err) {
    console.error(err);
    showToast('Ошибка сжатия обложки: ' + err.message, 'error');
  }
}

async function handleNightCoverUpload(proj, file) {
  try {
    showToast('Конвертация ночной обложки в WebP...', 'info');
    const result = await compressAndConvertToWebP(file);
    const targetPath = `images/${proj.folder}/cover_night.webp`;
    window.AdminState.newFilesMap.set(targetPath, result);

    proj.heroNight = targetPath;

    const banner = document.getElementById('nightCoverStatusBanner');
    const box = document.getElementById('nightCoverPreviewBox');
    banner.className = 'night-cover-status-banner active';
    banner.innerHTML = '<span>✓ Ночная обложка активна: на странице будет отображен переключатель освещения ДЕНЬ / НОЧЬ</span>';
    box.style.display = 'flex';
    document.getElementById('nightCoverImgPreview').src = result.dataUrl;
    document.getElementById('nightCoverPath').textContent = targetPath;
    document.getElementById('nightCoverName').textContent = 'cover_night.webp';
    showToast('Ночная обложка сохранена!', 'success');
  } catch (err) {
    console.error(err);
    showToast('Ошибка сжатия ночной обложки: ' + err.message, 'error');
  }
}

/**
 * Пакетная загрузка рендеров в помещение с именованием {prefix}_{NN}.webp
 */
async function handleRoomRendersUpload(proj, room, files, gridContainer) {
  try {
    showToast(`Конвертация ${files.length} изображений в WebP...`, 'info');
    const prefix = (room.prefix || 'render').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    // Определяем максимальный номер среди существующих кадров
    let maxIdx = 0;
    (room.items || []).forEach(it => {
      const paths = it.type === 'diptych' ? (it.items || []).map(p => p[0]) : [it.src];
      paths.forEach(p => {
        const m = p.match(/_(\d+)\.webp$/i);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxIdx) maxIdx = num;
        }
      });
    });

    for (let i = 0; i < files.length; i++) {
      maxIdx++;
      const file = files[i];
      const result = await compressAndConvertToWebP(file);
      const filename = `${prefix}_${String(maxIdx).padStart(2, '0')}.webp`;
      const targetPath = `images/${proj.folder}/${filename}`;
      window.AdminState.newFilesMap.set(targetPath, result);

      // Добавляем как новый одиночный кадр (auto раскладка)
      room.items = room.items || [];
      room.items.push({
        type: 'full',
        src: targetPath,
        cap: `${room.name} — Ракурс ${maxIdx}`,
        _dataUrl: result.dataUrl
      });
    }

    renderRoomItems(room, gridContainer, proj);
    showToast(`Успешно добавлено ${files.length} рендеров в помещение!`, 'success');
  } catch (err) {
    console.error(err);
    showToast('Ошибка обработки рендеров: ' + err.message, 'error');
  }
}


// ============================================================
// 3. ГЕНЕРАТОРЫ СТРАНИЦ САЙТА (100% ВАЛИДАЦИЯ VERIFY_ALL_CASES)
// ============================================================

/**
 * 1. Генератор HTML кейса по эталону project-makarovsky.html
 */
function generateProjectPageHTML(project, nextProject, contacts) {
  const titleText = `${project.title} — Студия дизайна интерьера FERRO DESIGN™`;
  const metaDesc = project.metaDesc || `Дизайн-проект интерьера ${project.title}, ${project.city} от студии FERRO DESIGN.`;
  const absOgImage = project.heroDay.startsWith('http') ? project.heroDay : `https://ferro-design.ru/${project.heroDay}`;

  // Генерация секций помещений
  let roomsHtml = '';
  (project.rooms || []).forEach(room => {
    roomsHtml += `\n    <!-- ==========================================\n         ${room.name.toUpperCase()} (${room.prefix})\n    ========================================== -->\n`;
    roomsHtml += `    <div class="room-header" id="${room.id}">\n`;
    roomsHtml += `      <h2 class="room-name">${escapeHtml(room.name.toUpperCase())}</h2>\n`;
    roomsHtml += `    </div>\n\n`;

    const items = room.items || [];
    // Поддержка раскладки
    items.forEach(it => {
      if (it.type === 'diptych' && it.items && it.items.length === 2) {
        roomsHtml += `    <div class="diptych-grid">\n`;
        it.items.forEach(([src, cap]) => {
          roomsHtml += `      <figure>\n        <div class="js-tilt">\n          <img src="${src}" alt="${escapeHtml(cap || '')}" loading="lazy" decoding="async">\n        </div>\n        <figcaption>${escapeHtml(cap || '')}</figcaption>\n      </figure>\n`;
        });
        roomsHtml += `    </div>\n\n`;
      } else if (it.type === 'full_compact') {
        roomsHtml += `    <figure class="media-block" style="max-width: 800px; margin-left: auto; margin-right: auto;">\n      <div class="js-tilt">\n        <img src="${it.src}" alt="${escapeHtml(it.cap || '')}" loading="lazy" decoding="async">\n      </div>\n      <figcaption>${escapeHtml(it.cap || '')}</figcaption>\n    </figure>\n\n`;
      } else {
        // Обычный full
        roomsHtml += `    <figure class="media-block">\n      <div class="js-tilt">\n        <img src="${it.src}" alt="${escapeHtml(it.cap || '')}" loading="lazy" decoding="async">\n      </div>\n      <figcaption>${escapeHtml(it.cap || '')}</figcaption>\n    </figure>\n\n`;
      }
    });
  });

  // Нижняя навигация по комнатам: строго те же room.id что и в заголовках!
  let navLinksHtml = '';
  (project.rooms || []).forEach((room, idx) => {
    navLinksHtml += `      <a href="#${room.id}" class="hw-room-link${idx === 0 ? ' active' : ''}">${escapeHtml(room.nav)}</a>\n`;
  });

  // Сценарий день/ночь в интро
  let lightingHtml = '';
  let heroNightImgHtml = '';
  if (project.heroNight) {
    heroNightImgHtml = `\n      <img src="${project.heroNight}" alt="${escapeHtml(project.title)} — Вечерний сценарий" class="hero-bg-layer hero-bg-night">`;
    lightingHtml = `        <div class="lighting-controls-wrap">
          <div class="lighting-mode-switch" role="group" aria-label="Сценарий освещения">
            <button type="button" class="lighting-mode-btn is-active" data-mode="day" aria-pressed="true" title="Дневной свет">
              <svg class="lighting-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
              <span>ДЕНЬ</span>
            </button>
            <button type="button" class="lighting-mode-btn" data-mode="night" aria-pressed="false" title="Вечерний свет">
              <svg class="lighting-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
              <span>НОЧЬ</span>
            </button>
          </div>
        </div>\n`;
  }

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${escapeHtml(titleText)}</title>
  <meta name="description" content="${escapeHtml(metaDesc)}">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(titleText)}">
  <meta property="og:description" content="${escapeHtml(metaDesc)}">
  <meta property="og:image" content="${absOgImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(titleText)}">
  <meta name="twitter:description" content="${escapeHtml(metaDesc)}">
  <meta name="twitter:image" content="${absOgImage}">

  <link rel="icon" id="dynamicFavicon" type="image/png" href="favicon.png">
  <link rel="stylesheet" href="style.css?v=2">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": "Дизайн интерьера ${escapeHtml(project.title)}",
    "description": "${escapeHtml(metaDesc)}",
    "creator": {
      "@type": "HomeAndConstructionBusiness",
      "name": "FERRO DESIGN™"
    }
  }
  </script>
</head>
<body>

  <!-- ФИКСИРОВАННАЯ ШАПКА -->
  <header class="glass-header">
    <div class="header-inner">
      <a href="index.html" class="logo-link">
        <img src="images/logo.png" alt="FERRO DESIGN" class="header-logo-img" onerror="this.style.display='none'; document.getElementById('txt-logo').style.display='block';">
        <span id="txt-logo" class="logo-brand-text" style="display: none;">FERRO DESIGN™</span>
      </a>

      <nav class="desktop-nav">
        <a href="projects.html" class="nav-link">Все проекты</a>
        <a href="index.html" class="nav-link">На главную</a>
      </nav>
    </div>
  </header>

  <!-- ГЛАВНЫЙ ЭКРАН -->
  <section class="project-intro">
    <div class="project-intro-bg">
      <img src="${project.heroDay}" alt="${escapeHtml(project.title)} — Дневной сценарий" class="hero-bg-layer hero-bg-day" fetchpriority="high">${heroNightImgHtml}
      <div class="project-intro-overlay"></div>
    </div>

    <div class="project-intro-container">
      <h1 class="project-title">${escapeHtml(project.title)}</h1>

      <div class="project-intro-bottom">
${lightingHtml}        <div class="project-yodezeen-specs">
          <div class="specs-col specs-col-left">
            <div class="specs-group">
              <span class="specs-label">Город</span>
              <span class="specs-val">${escapeHtml(project.city)}</span>
            </div>
            <div class="specs-group">
              <span class="specs-label">Площадь</span>
              <span class="specs-val">${project.area} м²</span>
            </div>
          </div>

          <div class="specs-col specs-col-right">
            <div class="specs-group">
              <span class="specs-label">Категория</span>
              <span class="specs-val">${escapeHtml(project.specsCategory)}</span>
            </div>
            <div class="specs-group">
              <span class="specs-label">Год реализации</span>
              <span class="specs-val">${escapeHtml(project.year)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <main class="project-body">
${roomsHtml}    <nav class="hw-room-nav" id="hwRoomNav" aria-label="Навигация по помещениям">
${navLinksHtml}    </nav>

    <div class="next-case-bar">
      <span class="next-sub">Следующий проект</span>
      <a href="${nextProject.filename}" class="next-title">
        <span>${escapeHtml(nextProject.title)}</span>
        <svg class="next-arrow-svg" viewBox="0 0 56 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M2 12H52M52 12L41 2M52 12L41 22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
    </div>
  </main>

  <!-- СЕКЦИЯ КОНТАКТОВ -->
  <section id="contact" class="contact-section">
    <div class="contact-container">
      <div class="contact-grid">
        <div class="contact-col-info">
          <h2 class="contact-title">Контакты</h2>
          <p class="contact-intro">
            ${escapeHtml(contacts.intro || 'Готовы обсудить ваш проект? Оставьте заявку или свяжитесь с нами удобным способом.')}
          </p>

          <div class="contact-details">
            <div class="contact-detail-row">
              <span class="detail-label">Локация</span>
              <span class="detail-val">${escapeHtml(contacts.location)}</span>
            </div>
            <div class="contact-detail-row">
              <span class="detail-label">Телефон</span>
              <a href="${contacts.phoneHref || ('tel:' + contacts.phone.replace(/[^0-9+]/g, ''))}" class="detail-val">${escapeHtml(contacts.phone)}</a>
            </div>
            <div class="contact-detail-row">
              <span class="detail-label">Email</span>
              <a href="mailto:${contacts.email}" class="detail-val">${escapeHtml(contacts.email)}</a>
            </div>
          </div>
        </div>

        <div class="contact-col-form">
          <form class="contact-form">
            <input type="text" name="website" style="display:none;" tabindex="-1" autocomplete="off">
            <div class="form-group">
              <label for="userName" class="form-label">Ваше имя</label>
              <input type="text" id="userName" name="name" class="form-input" placeholder="Егор" required>
            </div>

            <div class="form-group">
              <label for="userPhone" class="form-label">Телефон или Telegram</label>
              <input type="tel" id="userPhone" name="contact" class="form-input" placeholder="+7 (___) ___-__-__" required>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label for="userCity" class="form-label">Город</label>
                <input type="text" id="userCity" name="city" class="form-input" placeholder="Екатеринбург">
              </div>
              <div class="form-group">
                <label for="userArea" class="form-label">Площадь (м²)</label>
                <input type="number" id="userArea" name="area" class="form-input" placeholder="120">
              </div>
            </div>

            <div class="form-group">
              <label for="userComment" class="form-label">Комментарий к проекту</label>
              <textarea id="userComment" name="comment" class="form-input form-textarea" rows="3" placeholder="Расскажите о планировке, сроках и пожеланиях..."></textarea>
            </div>

            <button type="submit" class="btn-submit">Отправить заявку</button>
            <div class="form-privacy-note">
              Нажимая кнопку «Отправить заявку», вы соглашаетесь с условиями <a href="privacy.html" target="_blank">Политики конфиденциальности</a> и даете согласие на обработку персональных данных.
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>

  <!-- ПОДВАЛ САЙТА -->
  <footer class="site-footer">
    <div class="footer-socials">
      <a href="https://www.youtube.com/@ferrodesign7446/featured" target="_blank" rel="noopener" class="footer-social-btn" aria-label="YouTube">
        <img src="images/LOGO_SOCIALS/youtube.png" alt="YouTube">
      </a>
      <a href="https://ru.pinterest.com/ferro_design_ekb/" target="_blank" rel="noopener" class="footer-social-btn" aria-label="Pinterest">
        <img src="images/LOGO_SOCIALS/pinterest.png" alt="Pinterest">
      </a>
      <a href="https://t.me/ferrodesign_ekb" target="_blank" rel="noopener" class="footer-social-btn" aria-label="Telegram">
        <img src="images/LOGO_SOCIALS/telegram.png" alt="Telegram">
      </a>
    </div>

    <div class="footer-brand-banner">
      <div class="footer-brand-title" id="footerBrandTitle">FERRO DESIGN<span class="footer-brand-tm">™</span></div>
    </div>

    <div class="footer-bottom-bar">
      <div class="footer-copy">© 2026 FERRO DESIGN™. ИП СОКОЛОВА Н.В.</div>
      <ul class="footer-links">
        <li><a href="projects.html">ПРОЕКТЫ</a></li>
        <li><a href="index.html#services">УСЛУГИ</a></li>
        <li><a href="about.html">О НАС</a></li>
        <li><a href="privacy.html">ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ</a></li>
        <li><a href="index.html#contact">КОНТАКТЫ</a></li>
      </ul>
      <div class="footer-credits">НЕ ЯВЛЯЕТСЯ ПУБЛИЧНОЙ ОФЕРТОЙ</div>
    </div>
  </footer>

  <script src="script.js?v=2"></script>
</body>
</html>
`;
}

/**
 * 2. Генератор главной страницы index.html
 */
function generateIndexHTML(siteContent) {
  const home = siteContent.home;
  const contacts = home.contacts;
  const projectsMap = {};
  siteContent.projects.forEach(p => { projectsMap[p.filename] = p; });

  const homeOrder = siteContent.homeProjectsOrder;

  // Основная сетка 4 проекта
  let mainGridCards = '';
  for (let i = 0; i < 4 && i < homeOrder.length; i++) {
    const p = projectsMap[homeOrder[i]];
    if (!p) continue;
    mainGridCards += `
      <a href="${p.filename}" class="project-card">
        <div class="card-media-wrap">
          <img src="${p.cardImage || p.heroDay}" alt="${escapeHtml(p.title)}" loading="lazy" decoding="async">
          <span class="glass-badge">${escapeHtml(p.badgeLabel || 'Жилая квартира')}</span>
        </div>
        <div class="card-desc">
          <h3 class="card-project-title">${escapeHtml(p.title)}</h3>
          <span class="card-project-meta">${escapeHtml(p.cardCity || p.city)} · ${p.area} м²</span>
        </div>
      </a>\n`;
  }

  // Срезанный ряд 5-й и 6-й проекты
  let peekCards = '';
  for (let i = 4; i < 6 && i < homeOrder.length; i++) {
    const p = projectsMap[homeOrder[i]];
    if (!p) continue;
    peekCards += `
        <a href="${p.filename}" class="project-card" tabindex="-1" aria-hidden="true">
          <div class="card-media-wrap">
            <img src="${p.cardImage || p.heroDay}" alt="${escapeHtml(p.title)}" loading="lazy" decoding="async">
          </div>
          <div class="card-desc">
            <h3 class="card-project-title">${escapeHtml(p.title)}</h3>
            <span class="card-project-meta">${escapeHtml(p.cardCity || p.city)} · ${p.area} м²</span>
          </div>
        </a>\n`;
  }

  // Услуги
  let servicesCards = '';
  (home.services || []).forEach(srv => {
    servicesCards += `
        <div class="service-card">
          <span class="service-num">${srv.num}</span>
          <h3 class="service-name">${escapeHtml(srv.name)}</h3>
          <p class="service-desc">
            ${escapeHtml(srv.desc)}
          </p>
          <div class="service-price">${escapeHtml(srv.price)}</div>
        </div>\n`;
  });

  // Статистика
  let statsHtml = '';
  (home.aboutSection.stats || []).forEach(st => {
    statsHtml += `
          <div class="stat-card">
            <div class="stat-number-wrap">
              <span class="stat-number" data-target="${st.target}" data-suffix="${st.suffix}" ${st.format ? `data-format="${st.format}"` : ''}>0</span>
            </div>
            <div class="stat-label">${escapeHtml(st.label)}</div>
          </div>\n`;
  });

  // Массив проектов для Яндекс.Карты
  const mapProjectsJson = JSON.stringify(siteContent.projects.map(p => ({
    id: p.id,
    coords: p.coords,
    city: p.mapCity || p.cardCity || p.city,
    title: p.title,
    type: p.specsCategory,
    area: `${p.area} м²`,
    img: p.cardImage || p.heroDay,
    link: p.filename
  })), null, 8);

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FERRO DESIGN™ — Студия дизайна интерьера в Екатеринбурге</title>
  <meta name="description" content="FERRO DESIGN — премиальная студия дизайна интерьера. Разработка дизайн-проектов жилых и коммерческих пространств, комплектация и авторский надзор по всей России.">
  <link rel="icon" id="dynamicFavicon" type="image/png" href="favicon.png">

  <meta property="og:type" content="website">
  <meta property="og:title" content="FERRO DESIGN™ — Студия дизайна интерьера в Екатеринбурге">
  <meta property="og:description" content="Премиальный дизайн интерьеров квартир и загородных домов. От концепции до реализации под ключ.">
  <meta property="og:image" content="https://ferro-design.ru/images/COVER_MAIN/cover_main_makarovski.webp">

  <link rel="stylesheet" href="style.css?v=2">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "name": "FERRO DESIGN™",
    "description": "Студия дизайна интерьера премиум-класса в Екатеринбурге",
    "url": "https://ferro-design.ru/",
    "telephone": "${contacts.phone}",
    "email": "${contacts.email}",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "ул. Розы Люксембург, 17",
      "addressLocality": "Екатеринбург",
      "addressCountry": "RU"
    }
  }
  </script>
</head>
<body>

  <!-- ШАПКА -->
  <header class="glass-header">
    <div class="header-inner">
      <a href="index.html" class="logo-link">
        <img src="images/logo.png" alt="FERRO DESIGN" class="header-logo-img" onerror="this.style.display='none'; document.getElementById('txt-logo').style.display='block';">
        <span id="txt-logo" class="logo-brand-text" style="display: none;">FERRO DESIGN™</span>
      </a>

      <nav class="desktop-nav">
        <a href="projects.html" class="nav-link">Проекты</a>
        <a href="#services" class="nav-link">Услуги</a>
        <a href="about.html" class="nav-link">О нас</a>
        <a href="#contact" class="nav-link">Контакты</a>
      </nav>
    </div>
  </header>

  <!-- ПЕРВЫЙ ЭКРАН -->
  <section class="hero-section">
    <div class="hero-bg-media">
      <img src="images/NA_NEKRASOVA/cover.webp" alt="FERRO DESIGN — Студия дизайна интерьера" class="hero-slide active" fetchpriority="high">
      <img src="images/MAKAROVSKI_PORTUGALIA/cover.webp" alt="Интерьер FERRO DESIGN" class="hero-slide">
      <div class="hero-bg-overlay"></div>
    </div>

    <div class="hero-content">
      <div class="hero-title-container">
        <h1 class="hero-title-word">${escapeHtml(home.hero.title)}</h1>
        <p class="hero-description">${escapeHtml(home.hero.description)}</p>
      </div>

      <div class="hero-actions">
        <a href="projects.html" class="btn-outline-minimal">
          <span>${escapeHtml(home.hero.buttonText || 'Смотреть проекты')}</span>
          <svg class="btn-arrow-svg" viewBox="0 0 56 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M2 12H52M52 12L41 2M52 12L41 22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>
    </div>
  </section>

  <!-- СЕКЦИЯ ПРОЕКТОВ -->
  <section id="projects" class="featured-projects">
    <div class="section-title-wrap">
      <h2 class="featured-title">Проекты</h2>
    </div>

    <div class="projects-grid">
${mainGridCards}    </div>

    <div class="peek-row-container">
      <div class="projects-grid">
${peekCards}      </div>
      <div class="peek-fade-overlay"></div>
    </div>

    <div class="projects-cta-wrap">
      <a href="projects.html" class="ref-projects-btn">
        <span class="ref-projects-btn-text">Все проекты</span>
        <span class="ref-projects-btn-line"></span>
      </a>
    </div>
  </section>

  <!-- СЕКЦИЯ УСЛУГ -->
  <section id="services" class="services-section">
    <div class="services-container">
      <div class="section-title-wrap">
        <h2 class="services-section-title">Услуги</h2>
      </div>

      <div class="services-grid">
${servicesCards}      </div>
    </div>
  </section>

  <!-- СЕКЦИЯ О НАС -->
  <section id="about" class="about-section">
    <div class="about-container">
      <div class="about-title-row">
        <h2 class="about-section-title">О нас</h2>
      </div>

      <div class="about-manifesto-row">
        <p class="about-manifesto">
          ${escapeHtml(home.aboutSection.manifesto)}
        </p>
      </div>

      <div class="about-stats-grid">
${statsHtml}      </div>
    </div>
  </section>

  <!-- СЕКЦИЯ ГЕОГРАФИИ НА КАРТЕ -->
  <section class="geography-section">
    <div class="geography-container">
      <div class="section-title-wrap">
        <h2 class="geography-title">География проектов</h2>
      </div>
      <div class="geography-map-wrap">
        <div id="yandexMap" class="yandex-map-container"></div>
        <div id="mapPopupCard" class="map-popup-card">
          <button id="mapPopupClose" class="map-popup-close" aria-label="Закрыть">×</button>
          <img id="mapCardImg" src="" alt="Проект" class="map-card-thumb">
          <div class="map-card-content">
            <span id="mapCardCity" class="map-card-city"></span>
            <h4 id="mapCardTitle" class="map-card-title"></h4>
            <div class="map-card-meta">
              <span id="mapCardType"></span> · <span id="mapCardArea"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- КОНТАКТЫ -->
  <section id="contact" class="contact-section">
    <div class="contact-container">
      <div class="contact-grid">
        <div class="contact-col-info">
          <h2 class="contact-title">Контакты</h2>
          <p class="contact-intro">
            ${escapeHtml(contacts.intro)}
          </p>
          <div class="contact-details">
            <div class="contact-detail-row">
              <span class="detail-label">Локация</span>
              <span class="detail-val">${escapeHtml(contacts.location)}</span>
            </div>
            <div class="contact-detail-row">
              <span class="detail-label">Телефон</span>
              <a href="${contacts.phoneHref || ('tel:' + contacts.phone.replace(/[^0-9+]/g, ''))}" class="detail-val">${escapeHtml(contacts.phone)}</a>
            </div>
            <div class="contact-detail-row">
              <span class="detail-label">Email</span>
              <a href="mailto:${contacts.email}" class="detail-val">${escapeHtml(contacts.email)}</a>
            </div>
          </div>
        </div>

        <div class="contact-col-form">
          <form class="contact-form">
            <input type="text" name="website" style="display:none;" tabindex="-1" autocomplete="off">
            <div class="form-group">
              <label for="userName" class="form-label">Ваше имя</label>
              <input type="text" id="userName" name="name" class="form-input" placeholder="Егор" required>
            </div>
            <div class="form-group">
              <label for="userPhone" class="form-label">Телефон или Telegram</label>
              <input type="tel" id="userPhone" name="contact" class="form-input" placeholder="+7 (___) ___-__-__" required>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label for="userCity" class="form-label">Город</label>
                <input type="text" id="userCity" name="city" class="form-input" placeholder="Екатеринбург">
              </div>
              <div class="form-group">
                <label for="userArea" class="form-label">Площадь (м²)</label>
                <input type="number" id="userArea" name="area" class="form-input" placeholder="120">
              </div>
            </div>
            <div class="form-group">
              <label for="userComment" class="form-label">Комментарий к проекту</label>
              <textarea id="userComment" name="comment" class="form-input form-textarea" rows="3" placeholder="Расскажите о планировке, сроках и пожеланиях..."></textarea>
            </div>
            <button type="submit" class="btn-submit">Отправить заявку</button>
            <div class="form-privacy-note">
              Нажимая кнопку «Отправить заявку», вы соглашаетесь с условиями <a href="privacy.html" target="_blank">Политики конфиденциальности</a> и даете согласие на обработку персональных данных.
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>

  <!-- ПОДВАЛ -->
  <footer class="site-footer">
    <div class="footer-socials">
      <a href="https://www.youtube.com/@ferrodesign7446/featured" target="_blank" rel="noopener" class="footer-social-btn" aria-label="YouTube">
        <img src="images/LOGO_SOCIALS/youtube.png" alt="YouTube">
      </a>
      <a href="https://ru.pinterest.com/ferro_design_ekb/" target="_blank" rel="noopener" class="footer-social-btn" aria-label="Pinterest">
        <img src="images/LOGO_SOCIALS/pinterest.png" alt="Pinterest">
      </a>
      <a href="https://t.me/ferrodesign_ekb" target="_blank" rel="noopener" class="footer-social-btn" aria-label="Telegram">
        <img src="images/LOGO_SOCIALS/telegram.png" alt="Telegram">
      </a>
    </div>

    <div class="footer-brand-banner">
      <div class="footer-brand-title" id="footerBrandTitle">FERRO DESIGN<span class="footer-brand-tm">™</span></div>
    </div>

    <div class="footer-bottom-bar">
      <div class="footer-copy">© 2026 FERRO DESIGN™. ИП СОКОЛОВА Н.В.</div>
      <ul class="footer-links">
        <li><a href="projects.html">ПРОЕКТЫ</a></li>
        <li><a href="index.html#services">УСЛУГИ</a></li>
        <li><a href="about.html">О НАС</a></li>
        <li><a href="privacy.html">ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ</a></li>
        <li><a href="index.html#contact">КОНТАКТЫ</a></li>
      </ul>
      <div class="footer-credits">НЕ ЯВЛЯЕТСЯ ПУБЛИЧНОЙ ОФЕРТОЙ</div>
    </div>
  </footer>

  <script src="https://api-maps.yandex.ru/2.1/?apikey=ваш_ключ_api&lang=ru_RU"></script>
  <script>
    ymaps.ready(initMap);
    function initMap() {
      const map = new ymaps.Map('yandexMap', {
        center: [57.2, 55.0],
        zoom: 4,
        controls: ['zoomControl']
      }, {
        suppressMapOpenBlock: true
      });

      const projects = ${mapProjectsJson};

      const popupCard = document.getElementById('mapPopupCard');
      const cardImg = document.getElementById('mapCardImg');
      const cardCity = document.getElementById('mapCardCity');
      const cardTitle = document.getElementById('mapCardTitle');
      const cardType = document.getElementById('mapCardType');
      const cardArea = document.getElementById('mapCardArea');

      let activeProjectId = null;

      projects.forEach(p => {
        const placemark = new ymaps.Placemark(p.coords, {
          hintContent: p.city + ' — ' + p.title
        }, {
          preset: 'islands#circleIconWithCaption',
          iconColor: '#ecbe26',
          iconCaption: p.city
        });

        placemark.events.add('click', () => {
          if (activeProjectId === p.id) {
            window.location.href = p.link;
            return;
          }
          activeProjectId = p.id;
          cardImg.src = p.img;
          cardCity.textContent = p.city;
          cardTitle.textContent = p.title;
          cardType.textContent = p.type;
          cardArea.textContent = p.area;
          popupCard.onclick = (e) => {
            if (e.target.closest('#mapPopupClose')) return;
            window.location.href = p.link;
          };
          popupCard.classList.add('visible');
        });

        map.geoObjects.add(placemark);
      });

      const popupClose = document.getElementById('mapPopupClose');
      if (popupClose) {
        popupClose.addEventListener('click', (e) => {
          e.stopPropagation();
          popupCard.classList.remove('visible');
          activeProjectId = null;
        });
      }
      map.events.add('click', () => {
        popupCard.classList.remove('visible');
        activeProjectId = null;
      });
    }
  </script>

  <script src="script.js?v=2"></script>
</body>
</html>
`;
}

/**
 * 3. Генератор каталога projects.html
 */
function generateProjectsCatalogHTML(siteContent) {
  const contacts = siteContent.home.contacts;
  const projectsMap = {};
  siteContent.projects.forEach(p => { projectsMap[p.filename] = p; });

  let cardsHtml = '';
  siteContent.allProjectsOrder.forEach(fn => {
    const p = projectsMap[fn];
    if (!p) return;
    cardsHtml += `
        <!-- ${p.title} -->
        <a href="${p.filename}" class="project-card hw-card" data-category="${p.filterCategory}" data-area="${p.area}">
          <div class="card-media-wrap">
            <img src="${p.cardImage || p.heroDay}" alt="${escapeHtml(p.title)}" loading="lazy" decoding="async">
            <span class="glass-badge">${escapeHtml(p.badgeLabel || 'Жилая квартира')}</span>
          </div>
          <div class="card-desc">
            <h3 class="card-project-title">${escapeHtml(p.title)}</h3>
            <span class="card-project-meta">${escapeHtml(p.cardCity || p.city)} · ${p.area} м²</span>
          </div>
        </a>\n`;
  });

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Все проекты — Студия дизайна интерьера FERRO DESIGN™</title>
  <meta name="description" content="Портфолио реализованных дизайн-проектов интерьера студии FERRO DESIGN: квартиры, загородные дома и коммерческие пространства.">
  <link rel="icon" id="dynamicFavicon" type="image/png" href="favicon.png">

  <meta property="og:type" content="website">
  <meta property="og:title" content="Все проекты — Студия дизайна интерьера FERRO DESIGN™">
  <meta property="og:description" content="Премиальное портфолио дизайн-проектов квартир и домов.">
  <meta property="og:image" content="https://ferro-design.ru/images/COVER_MAIN/cover_main_makarovski.webp">

  <link rel="stylesheet" href="style.css?v=2">
</head>
<body>

  <!-- ШАПКА -->
  <header class="glass-header">
    <div class="header-inner">
      <a href="index.html" class="logo-link">
        <img src="images/logo.png" alt="FERRO DESIGN" class="header-logo-img" onerror="this.style.display='none'; document.getElementById('txt-logo').style.display='block';">
        <span id="txt-logo" class="logo-brand-text" style="display: none;">FERRO DESIGN™</span>
      </a>

      <nav class="desktop-nav">
        <a href="projects.html" class="nav-link active">Проекты</a>
        <a href="index.html#services" class="nav-link">Услуги</a>
        <a href="about.html" class="nav-link">О нас</a>
        <a href="#contact" class="nav-link">Контакты</a>
      </nav>
    </div>
  </header>

  <!-- СЕКЦИЯ КАТАЛОГА -->
  <main class="projects-page-section">
    <div class="projects-page-container">
      <div class="section-header projects-header-row">
        <h1 class="section-title" id="hwTitle">Все проекты</h1>
        
        <div class="projects-filters-bar">
          <div class="projects-filter-tabs" role="group" aria-label="Тип объекта">
            <button class="filter-tab-btn js-type-filter active" data-filter-type="all" data-title="Все проекты">Все</button>
            <button class="filter-tab-btn js-type-filter" data-filter-type="flats" data-title="Жилые квартиры">Жилые квартиры</button>
            <button class="filter-tab-btn js-type-filter" data-filter-type="houses" data-title="Загородные дома">Загородные дома</button>
            <button class="filter-tab-btn js-type-filter" data-filter-type="commercial" data-title="Коммерческие объекты">Коммерческие объекты</button>
          </div>

          <div class="projects-filter-tabs" role="group" aria-label="Площадь объекта">
            <button class="filter-tab-btn js-area-filter active" data-filter-area="all">Любая площадь</button>
            <button class="filter-tab-btn js-area-filter" data-filter-area="under100">До 100 м²</button>
            <button class="filter-tab-btn js-area-filter" data-filter-area="100to200">100–200 м²</button>
            <button class="filter-tab-btn js-area-filter" data-filter-area="over200">От 200 м²</button>
          </div>
        </div>
      </div>

      <div class="projects-grid">
${cardsHtml}      </div>
    </div>
  </main>

  <!-- КОНТАКТЫ -->
  <section id="contact" class="contact-section">
    <div class="contact-container">
      <div class="contact-grid">
        <div class="contact-col-info">
          <h2 class="contact-title">Контакты</h2>
          <p class="contact-intro">
            ${escapeHtml(contacts.intro)}
          </p>
          <div class="contact-details">
            <div class="contact-detail-row">
              <span class="detail-label">Локация</span>
              <span class="detail-val">${escapeHtml(contacts.location)}</span>
            </div>
            <div class="contact-detail-row">
              <span class="detail-label">Телефон</span>
              <a href="${contacts.phoneHref || ('tel:' + contacts.phone.replace(/[^0-9+]/g, ''))}" class="detail-val">${escapeHtml(contacts.phone)}</a>
            </div>
            <div class="contact-detail-row">
              <span class="detail-label">Email</span>
              <a href="mailto:${contacts.email}" class="detail-val">${escapeHtml(contacts.email)}</a>
            </div>
          </div>
        </div>

        <div class="contact-col-form">
          <form class="contact-form">
            <input type="text" name="website" style="display:none;" tabindex="-1" autocomplete="off">
            <div class="form-group">
              <label for="userName" class="form-label">Ваше имя</label>
              <input type="text" id="userName" name="name" class="form-input" placeholder="Егор" required>
            </div>
            <div class="form-group">
              <label for="userPhone" class="form-label">Телефон или Telegram</label>
              <input type="tel" id="userPhone" name="contact" class="form-input" placeholder="+7 (___) ___-__-__" required>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label for="userCity" class="form-label">Город</label>
                <input type="text" id="userCity" name="city" class="form-input" placeholder="Екатеринбург">
              </div>
              <div class="form-group">
                <label for="userArea" class="form-label">Площадь (м²)</label>
                <input type="number" id="userArea" name="area" class="form-input" placeholder="120">
              </div>
            </div>
            <div class="form-group">
              <label for="userComment" class="form-label">Комментарий к проекту</label>
              <textarea id="userComment" name="comment" class="form-input form-textarea" rows="3" placeholder="Расскажите о планировке, сроках и пожеланиях..."></textarea>
            </div>
            <button type="submit" class="btn-submit">Отправить заявку</button>
            <div class="form-privacy-note">
              Нажимая кнопку «Отправить заявку», вы соглашаетесь с условиями <a href="privacy.html" target="_blank">Политики конфиденциальности</a> и даете согласие на обработку персональных данных.
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>

  <!-- ПОДВАЛ -->
  <footer class="site-footer">
    <div class="footer-socials">
      <a href="https://www.youtube.com/@ferrodesign7446/featured" target="_blank" rel="noopener" class="footer-social-btn" aria-label="YouTube">
        <img src="images/LOGO_SOCIALS/youtube.png" alt="YouTube">
      </a>
      <a href="https://ru.pinterest.com/ferro_design_ekb/" target="_blank" rel="noopener" class="footer-social-btn" aria-label="Pinterest">
        <img src="images/LOGO_SOCIALS/pinterest.png" alt="Pinterest">
      </a>
      <a href="https://t.me/ferrodesign_ekb" target="_blank" rel="noopener" class="footer-social-btn" aria-label="Telegram">
        <img src="images/LOGO_SOCIALS/telegram.png" alt="Telegram">
      </a>
    </div>

    <div class="footer-brand-banner">
      <div class="footer-brand-title" id="footerBrandTitle">FERRO DESIGN<span class="footer-brand-tm">™</span></div>
    </div>

    <div class="footer-bottom-bar">
      <div class="footer-copy">© 2026 FERRO DESIGN™. ИП СОКОЛОВА Н.В.</div>
      <ul class="footer-links">
        <li><a href="projects.html">ПРОЕКТЫ</a></li>
        <li><a href="index.html#services">УСЛУГИ</a></li>
        <li><a href="about.html">О НАС</a></li>
        <li><a href="privacy.html">ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ</a></li>
        <li><a href="index.html#contact">КОНТАКТЫ</a></li>
      </ul>
      <div class="footer-credits">НЕ ЯВЛЯЕТСЯ ПУБЛИЧНОЙ ОФЕРТОЙ</div>
    </div>
  </footer>

  <script src="script.js?v=2"></script>
</body>
</html>
`;
}

/**
 * 4. Генератор страницы about.html
 */
function generateAboutHTML(siteContent) {
  const about = siteContent.aboutPage;
  const contacts = siteContent.home.contacts;

  let stepsHtml = '';
  (about.steps || []).forEach(step => {
    stepsHtml += `
        <div class="design-step-card">
          <span class="step-num">${step.num}</span>
          <h3 class="step-title">${escapeHtml(step.title)}</h3>
          <p class="step-desc">
            ${escapeHtml(step.text)}
          </p>
        </div>\n`;
  });

  let faqItemsHtml = '';
  let faqSchemaQuestions = [];
  (about.faq || []).forEach(f => {
    faqItemsHtml += `
        <details class="faq-item">
          <summary class="faq-question">
            <span>${escapeHtml(f.question)}</span>
            <span class="faq-icon" aria-hidden="true">+</span>
          </summary>
          <div class="faq-answer">
            <p>${escapeHtml(f.answer)}</p>
          </div>
        </details>\n`;

    faqSchemaQuestions.push({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer
      }
    });
  });

  const faqJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqSchemaQuestions
  }, null, 2);

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>О студии FERRO DESIGN™ — Студия дизайна интерьера</title>
  <meta name="description" content="FERRO DESIGN — команда профессионалов в области архитектурного проектирования и дизайна интерьера. Авторский надзор, комплектация и реализация под ключ.">
  <link rel="icon" id="dynamicFavicon" type="image/png" href="favicon.png">

  <meta property="og:type" content="website">
  <meta property="og:title" content="О студии FERRO DESIGN™">
  <meta property="og:description" content="Премиальный дизайн интерьеров от команды FERRO DESIGN.">
  <meta property="og:image" content="https://ferro-design.ru/images/COVER_MAIN/cover_main_makarovski.webp">

  <link rel="stylesheet" href="style.css?v=2">

  <script type="application/ld+json">
${faqJsonLd}
  </script>
</head>
<body>

  <!-- ШАПКА -->
  <header class="glass-header">
    <div class="header-inner">
      <a href="index.html" class="logo-link">
        <img src="images/logo.png" alt="FERRO DESIGN" class="header-logo-img" onerror="this.style.display='none'; document.getElementById('txt-logo').style.display='block';">
        <span id="txt-logo" class="logo-brand-text" style="display: none;">FERRO DESIGN™</span>
      </a>

      <nav class="desktop-nav">
        <a href="projects.html" class="nav-link">Проекты</a>
        <a href="index.html#services" class="nav-link">Услуги</a>
        <a href="about.html" class="nav-link active">О нас</a>
        <a href="#contact" class="nav-link">Контакты</a>
      </nav>
    </div>
  </header>

  <!-- ОСНОВНАЯ ЧАСТЬ О СТУДИИ -->
  <main class="about-page-main">
    <div class="about-page-container">
      <div class="about-hero-block">
        <span class="about-chief-badge">${escapeHtml(about.badge || 'Артем Марченко / Главный дизайнер')}</span>
        <h1 class="about-page-title">${escapeHtml(about.title)}</h1>
        <p class="about-lead">
          ${escapeHtml(about.lead)}
        </p>
      </div>

      <!-- ЭТАПЫ РАБОТЫ -->
      <section class="about-steps-section">
        <div class="section-title-wrap">
          <h2 class="about-block-title">Этапы создания дизайн-проекта</h2>
        </div>
        <div class="design-steps-grid">
${stepsHtml}        </div>
      </section>

      <!-- АВТОРСКИЙ НАДЗОР -->
      <section class="about-supervision-section">
        <div class="supervision-card">
          ${about.supervisionHtml}
        </div>
      </section>

      <!-- ГЕОГРАФИЯ -->
      <section class="about-geo-section">
        <div class="geo-card">
          ${about.geoHtml}
        </div>
      </section>

      <!-- FAQ -->
      <section class="about-faq-section">
        <div class="section-title-wrap">
          <h2 class="about-block-title">Часто задаваемые вопросы</h2>
        </div>
        <div class="faq-accordion-list">
${faqItemsHtml}        </div>
      </section>
    </div>
  </main>

  <!-- КОНТАКТЫ -->
  <section id="contact" class="contact-section">
    <div class="contact-container">
      <div class="contact-grid">
        <div class="contact-col-info">
          <h2 class="contact-title">Контакты</h2>
          <p class="contact-intro">
            ${escapeHtml(contacts.intro)}
          </p>
          <div class="contact-details">
            <div class="contact-detail-row">
              <span class="detail-label">Локация</span>
              <span class="detail-val">${escapeHtml(contacts.location)}</span>
            </div>
            <div class="contact-detail-row">
              <span class="detail-label">Телефон</span>
              <a href="${contacts.phoneHref || ('tel:' + contacts.phone.replace(/[^0-9+]/g, ''))}" class="detail-val">${escapeHtml(contacts.phone)}</a>
            </div>
            <div class="contact-detail-row">
              <span class="detail-label">Email</span>
              <a href="mailto:${contacts.email}" class="detail-val">${escapeHtml(contacts.email)}</a>
            </div>
          </div>
        </div>

        <div class="contact-col-form">
          <form class="contact-form">
            <input type="text" name="website" style="display:none;" tabindex="-1" autocomplete="off">
            <div class="form-group">
              <label for="userName" class="form-label">Ваше имя</label>
              <input type="text" id="userName" name="name" class="form-input" placeholder="Егор" required>
            </div>
            <div class="form-group">
              <label for="userPhone" class="form-label">Телефон или Telegram</label>
              <input type="tel" id="userPhone" name="contact" class="form-input" placeholder="+7 (___) ___-__-__" required>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label for="userCity" class="form-label">Город</label>
                <input type="text" id="userCity" name="city" class="form-input" placeholder="Екатеринбург">
              </div>
              <div class="form-group">
                <label for="userArea" class="form-label">Площадь (м²)</label>
                <input type="number" id="userArea" name="area" class="form-input" placeholder="120">
              </div>
            </div>
            <div class="form-group">
              <label for="userComment" class="form-label">Комментарий к проекту</label>
              <textarea id="userComment" name="comment" class="form-input form-textarea" rows="3" placeholder="Расскажите о планировке, сроках и пожеланиях..."></textarea>
            </div>
            <button type="submit" class="btn-submit">Отправить заявку</button>
            <div class="form-privacy-note">
              Нажимая кнопку «Отправить заявку», вы соглашаетесь с условиями <a href="privacy.html" target="_blank">Политики конфиденциальности</a> и даете согласие на обработку персональных данных.
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>

  <!-- ПОДВАЛ -->
  <footer class="site-footer">
    <div class="footer-socials">
      <a href="https://www.youtube.com/@ferrodesign7446/featured" target="_blank" rel="noopener" class="footer-social-btn" aria-label="YouTube">
        <img src="images/LOGO_SOCIALS/youtube.png" alt="YouTube">
      </a>
      <a href="https://ru.pinterest.com/ferro_design_ekb/" target="_blank" rel="noopener" class="footer-social-btn" aria-label="Pinterest">
        <img src="images/LOGO_SOCIALS/pinterest.png" alt="Pinterest">
      </a>
      <a href="https://t.me/ferrodesign_ekb" target="_blank" rel="noopener" class="footer-social-btn" aria-label="Telegram">
        <img src="images/LOGO_SOCIALS/telegram.png" alt="Telegram">
      </a>
    </div>

    <div class="footer-brand-banner">
      <div class="footer-brand-title" id="footerBrandTitle">FERRO DESIGN<span class="footer-brand-tm">™</span></div>
    </div>

    <div class="footer-bottom-bar">
      <div class="footer-copy">© 2026 FERRO DESIGN™. ИП СОКОЛОВА Н.В.</div>
      <ul class="footer-links">
        <li><a href="projects.html">ПРОЕКТЫ</a></li>
        <li><a href="index.html#services">УСЛУГИ</a></li>
        <li><a href="about.html">О НАС</a></li>
        <li><a href="privacy.html">ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ</a></li>
        <li><a href="index.html#contact">КОНТАКТЫ</a></li>
      </ul>
      <div class="footer-credits">НЕ ЯВЛЯЕТСЯ ПУБЛИЧНОЙ ОФЕРТОЙ</div>
    </div>
  </footer>

  <script src="script.js?v=2"></script>
</body>
</html>
`;
}

/**
 * 5. Генератор sitemap.xml
 */
function generateSitemapXML(siteContent) {
  const today = new Date().toISOString().split('T')[0];
  let urls = `  <url>\n    <loc>https://ferro-design.ru/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  urls += `  <url>\n    <loc>https://ferro-design.ru/about.html</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  urls += `  <url>\n    <loc>https://ferro-design.ru/projects.html</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;

  siteContent.allProjectsOrder.forEach(fn => {
    urls += `  <url>\n    <loc>https://ferro-design.ru/${fn}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  });

  urls += `  <url>\n    <loc>https://ferro-design.ru/privacy.html</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.3</priority>\n  </url>`;

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}


// ============================================================
// 4. ЖИВОЙ ПРЕДПРОСМОТР В IFRAME С BLOB URL
// ============================================================

function openLivePreview(targetFilename) {
  const iframe = document.getElementById('previewIframe');
  if (!iframe || !window.AdminState.data) return;

  const data = window.AdminState.data;
  syncFormDataToState();

  let html = '';
  if (targetFilename === 'index.html') {
    html = generateIndexHTML(data);
  } else if (targetFilename === 'projects.html') {
    html = generateProjectsCatalogHTML(data);
  } else if (targetFilename === 'about.html') {
    html = generateAboutHTML(data);
  } else {
    // Страница кейса
    const projIdx = data.allProjectsOrder.indexOf(targetFilename);
    const curProj = data.projects.find(p => p.filename === targetFilename) || data.projects[0];
    const nextIdx = (projIdx + 1) % data.allProjectsOrder.length;
    const nextFilename = data.allProjectsOrder[nextIdx];
    const nextProj = data.projects.find(p => p.filename === nextFilename) || data.projects[0];
    html = generateProjectPageHTML(curProj, nextProj, data.home.contacts);
  }

  // Подменяем пути на Blob URLs для только что загруженных файлов
  window.AdminState.newFilesMap.forEach((val, virtualPath) => {
    const rx = new RegExp(escapeRegex(virtualPath), 'g');
    html = html.replace(rx, val.dataUrl);
  });

  // Внедряем <base href="../"> чтобы стили и изображения с диска грузились штатно
  html = html.replace('<head>', '<head>\n  <base href="../">\n');

  iframe.srcdoc = html;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


// ============================================================
// 5. ВАЛИДАЦИЯ САЙТА ПО 10 ПРАВИЛАМ VERIFY_ALL_CASES
// ============================================================

function runClientSideValidation(siteContent) {
  const errors = [];
  const projectsMap = {};
  siteContent.projects.forEach(p => { projectsMap[p.filename] = p; });

  const order = siteContent.allProjectsOrder;
  for (let i = 0; i < order.length; i++) {
    const curFn = order[i];
    const nextFn = order[(i + 1) % order.length];
    const curProj = projectsMap[curFn];
    const nextProj = projectsMap[nextFn];

    if (!curProj) {
      errors.push(`Проект ${curFn} из allProjectsOrder не найден в массиве projects`);
      continue;
    }
    if (!nextProj) {
      errors.push(`Следующий проект ${nextFn} не найден в массиве projects`);
      continue;
    }

    const html = generateProjectPageHTML(curProj, nextProj, siteContent.home.contacts);

    // 1. No inline <style> tags
    if (html.includes('<style>') || html.includes('<style ')) {
      errors.push(`${curFn}: найден запрещенный тег <style>`);
    }

    // 2. Header
    if (!html.includes('class="glass-header"') || !html.includes('На главную') || !html.includes('Все проекты')) {
      errors.push(`${curFn}: повреждена шапка glass-header`);
    }
    const headerMatch = html.match(/<header class="glass-header">([\s\S]*?)<\/header>/);
    if (headerMatch && (headerMatch[1].toLowerCase().includes('svg') || headerMatch[1].includes('→'))) {
      errors.push(`${curFn}: в glass-header обнаружены запрещенные стрелки/svg`);
    }

    // 3. Specs
    if (!html.includes('project-yodezeen-specs')) {
      errors.push(`${curFn}: отсутствует блок характеристик project-yodezeen-specs`);
    }

    // 4. Room IDs == Nav Hrefs
    const roomIds = Array.from(html.matchAll(/<div class="room-header"\s+id="([^"]+)">/g)).map(m => m[1]);
    const navHrefs = Array.from(html.matchAll(/<a href="#([^"]+)"\s+class="hw-room-link[^"]*">/g)).map(m => m[1]);
    if (roomIds.length === 0) {
      errors.push(`${curFn}: нет помещений room-header`);
    } else if (JSON.stringify(roomIds) !== JSON.stringify(navHrefs)) {
      errors.push(`${curFn}: ID помещений [${roomIds}] не совпадают с меню [${navHrefs}]`);
    }

    // 5. Next case bar
    const nextMatch = html.match(/<div class="next-case-bar">[\s\S]*?<a href="([^"]+)"[\s\S]*?<span>(.*?)<\/span>/);
    if (!nextMatch || nextMatch[1].trim() !== nextFn) {
      errors.push(`${curFn}: неверная ссылка на следующий проект в next-case-bar`);
    }

    // 6. Form fields
    ['name="website"', 'name="name"', 'name="contact"', 'name="city"', 'name="area"', 'name="comment"'].forEach(fld => {
      if (!html.includes(fld)) errors.push(`${curFn}: отсутствует обязательное поле формы ${fld}`);
    });

    // 7. Footer
    ['site-footer', 'footer-socials', 'footer-brand-banner', 'footer-bottom-bar', 'FERRO DESIGN™'].forEach(elem => {
      if (!html.includes(elem)) errors.push(`${curFn}: отсутствует обязательный элемент подвала ${elem}`);
    });

    // 8. Script and CSS
    if (!html.includes('style.css?v=2') || !html.includes('script.js?v=2')) {
      errors.push(`${curFn}: отсутствует style.css?v=2 или script.js?v=2`);
    }

    // 9. OG image absolute
    const ogMatch = html.match(/<meta property="og:image" content="([^"]+)">/);
    if (!ogMatch || !ogMatch[1].startsWith('https://ferro-design.ru/')) {
      errors.push(`${curFn}: og:image не является абсолютным URL https://ferro-design.ru/...`);
    }
  }

  return errors;
}


// ============================================================
// 6. ПУБЛИКАЦИЯ В GITHUB (GIT TREES ATOMIC COMMIT)
// ============================================================

async function handleSitePublication() {
  const token = window.AdminState.githubToken;
  const repo = window.AdminState.githubRepo;
  const branch = window.AdminState.githubBranch;

  const progressBox = document.getElementById('publishProgressContainer');
  const progressStep = document.getElementById('publishProgressStep');
  const confirmBtn = document.getElementById('btnConfirmPublishFinal');
  const cancelBtn = document.getElementById('btnCancelPublish');

  syncFormDataToState();
  const data = window.AdminState.data;

  // 1. Клиентская валидация
  if (progressBox) progressBox.style.display = 'block';
  if (progressStep) progressStep.textContent = '1/5. Проверка целостности по 10 стандартам...';

  const errors = runClientSideValidation(data);
  if (errors.length > 0) {
    alert(`Обнаружены ошибки валидации (${errors.length}):\n\n` + errors.slice(0, 5).join('\n'));
    if (progressBox) progressBox.style.display = 'none';
    return;
  }

  // Если нет токена — предлагаем скачать архив
  if (!token) {
    if (progressBox) progressBox.style.display = 'none';
    closeModal('modalPublishConfirm');
    if (confirm('Personal Access Token не указан в настройках.\nСкачать обновленные файлы сайта архивом на компьютер?')) {
      exportAllFilesZip();
    }
    return;
  }

  try {
    confirmBtn.disabled = true;
    cancelBtn.disabled = true;

    // 2. Получение текущего коммита
    if (progressStep) progressStep.textContent = '2/5. Подключение к репозиторию GitHub...';
    const refRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
      headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!refRes.ok) throw new Error(`Не удалось получить ветку ${branch}: ${refRes.statusText}`);
    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    const commitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits/${latestCommitSha}`, {
      headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // 3. Загрузка новых картинок как Git Blobs
    if (progressStep) progressStep.textContent = `3/5. Загрузка новых изображений WebP (${window.AdminState.newFilesMap.size} шт.)...`;
    const treeItems = [];

    for (const [vPath, fData] of window.AdminState.newFilesMap.entries()) {
      const blobRes = await fetch(`https://api.github.com/repos/${repo}/git/blobs`, {
        method: 'POST',
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' },
        body: JSON.stringify({ content: fData.base64, encoding: 'base64' })
      });
      if (!blobRes.ok) throw new Error(`Ошибка создания блоба ${vPath}`);
      const blobData = await blobRes.json();
      treeItems.push({
        path: vPath,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha
      });
    }

    // 4. Генерация и добавление HTML/JSON/XML
    if (progressStep) progressStep.textContent = '4/5. Генерация HTML-страниц и каталога...';

    // data/site-content.json
    treeItems.push({
      path: 'data/site-content.json',
      mode: '100644',
      type: 'blob',
      content: JSON.stringify(data, null, 2)
    });

    // index.html
    treeItems.push({
      path: 'index.html',
      mode: '100644',
      type: 'blob',
      content: generateIndexHTML(data)
    });

    // projects.html
    treeItems.push({
      path: 'projects.html',
      mode: '100644',
      type: 'blob',
      content: generateProjectsCatalogHTML(data)
    });

    // about.html
    treeItems.push({
      path: 'about.html',
      mode: '100644',
      type: 'blob',
      content: generateAboutHTML(data)
    });

    // sitemap.xml
    treeItems.push({
      path: 'sitemap.xml',
      mode: '100644',
      type: 'blob',
      content: generateSitemapXML(data)
    });

    // Кейсы проектов
    const projectsMap = {};
    data.projects.forEach(p => { projectsMap[p.filename] = p; });
    const order = data.allProjectsOrder;

    for (let i = 0; i < order.length; i++) {
      const curProj = projectsMap[order[i]];
      const nextProj = projectsMap[order[(i + 1) % order.length]];
      if (curProj && nextProj) {
        treeItems.push({
          path: curProj.filename,
          mode: '100644',
          type: 'blob',
          content: generateProjectPageHTML(curProj, nextProj, data.home.contacts)
        });
      }
    }

    // 5. Создание дерева и атомарного коммита
    if (progressStep) progressStep.textContent = '5/5. Атомарный коммит и обновление ветки main...';
    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
      method: 'POST',
      headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' },
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems })
    });
    if (!treeRes.ok) throw new Error('Ошибка создания Git Tree');
    const newTreeData = await treeRes.json();

    const newCommitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
      method: 'POST',
      headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' },
      body: JSON.stringify({
        message: 'admin: автоматическое обновление контента и кейсов студии FERRO DESIGN™',
        tree: newTreeData.sha,
        parents: [latestCommitSha]
      })
    });
    if (!newCommitRes.ok) throw new Error('Ошибка создания коммита');
    const newCommitData = await newCommitRes.json();

    const updateRefRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' },
      body: JSON.stringify({ sha: newCommitData.sha, force: false })
    });
    if (!updateRefRes.ok) throw new Error('Ошибка обновления ветки main');

    // Очищаем локальные блобы картинок (они уже на GitHub)
    window.AdminState.newFilesMap.clear();

    // Запускаем 10-минутный таймер блокировки
    window.AdminState.publishLockUntil = Date.now() + 10 * 60 * 1000;
    localStorage.setItem('ferro_publish_lock_until', String(window.AdminState.publishLockUntil));

    closeModal('modalPublishConfirm');
    showToast('Сайт успешно опубликован! GitHub Pages собирает обновления.', 'success');
  } catch (err) {
    console.error(err);
    alert('Ошибка публикации: ' + err.message);
  } finally {
    confirmBtn.disabled = false;
    cancelBtn.disabled = false;
    if (progressBox) progressBox.style.display = 'none';
  }
}


// ============================================================
// 7. ЭКСПОРТ И СКАЧИВАНИЕ ОБНОВЛЕННЫХ ФАЙЛОВ (ZIP)
// ============================================================

function initZipExport() {
  const btn = document.getElementById('btnDownloadZipArchive');
  if (btn) btn.onclick = () => exportAllFilesZip();
}

/**
 * Создает и скачивает ZIP-архив со всеми файлами сайта (без внешних библиотек)
 */
async function exportAllFilesZip() {
  syncFormDataToState();
  const data = window.AdminState.data;
  showToast('Формирование архива сайта...', 'info');

  const files = [];

  // JSON
  files.push({ name: 'data/site-content.json', content: JSON.stringify(data, null, 2) });
  // HTML & XML
  files.push({ name: 'index.html', content: generateIndexHTML(data) });
  files.push({ name: 'projects.html', content: generateProjectsCatalogHTML(data) });
  files.push({ name: 'about.html', content: generateAboutHTML(data) });
  files.push({ name: 'sitemap.xml', content: generateSitemapXML(data) });

  const projectsMap = {};
  data.projects.forEach(p => { projectsMap[p.filename] = p; });
  const order = data.allProjectsOrder;
  for (let i = 0; i < order.length; i++) {
    const curProj = projectsMap[order[i]];
    const nextProj = projectsMap[order[(i + 1) % order.length]];
    if (curProj && nextProj) {
      files.push({
        name: curProj.filename,
        content: generateProjectPageHTML(curProj, nextProj, data.home.contacts)
      });
    }
  }

  // Добавляем новые изображения
  for (const [vPath, fData] of window.AdminState.newFilesMap.entries()) {
    files.push({ name: vPath, binary: fData.blob });
  }

  try {
    const zipBlob = await createZipBlob(files);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `FERRO_DESIGN_EXPORT_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Архив успешно скачан на компьютер!', 'success');
  } catch (err) {
    console.error(err);
    showToast('Ошибка архивации: ' + err.message, 'error');
  }
}

/**
 * Минималистичный сборщик ZIP (стандарт PKZip Store)
 */
async function createZipBlob(files) {
  const parts = [];
  const centralDir = [];
  let offset = 0;

  for (const file of files) {
    let fileBytes;
    if (file.binary) {
      fileBytes = new Uint8Array(await file.binary.arrayBuffer());
    } else {
      fileBytes = new TextEncoder().encode(file.content);
    }

    const nameBytes = new TextEncoder().encode(file.name);
    const crc = crc32(fileBytes);
    const size = fileBytes.length;

    // Local file header (30 bytes + name)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true); // version needed
    view.setUint16(6, 0, true); // flags
    view.setUint16(8, 0, true); // compression: 0 = Store
    view.setUint16(10, 0, true); // mod time
    view.setUint16(12, 0, true); // mod date
    view.setUint32(14, crc, true);
    view.setUint32(18, size, true); // compressed size
    view.setUint32(22, size, true); // uncompressed size
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true); // extra length
    localHeader.set(nameBytes, 30);

    parts.push(localHeader);
    parts.push(fileBytes);

    // Central directory header (46 bytes + name)
    const cdHeader = new Uint8Array(46 + nameBytes.length);
    const cdView = new DataView(cdHeader.buffer);
    cdView.setUint32(0, 0x02014b50, true);
    cdView.setUint16(4, 20, true); // version made by
    cdView.setUint16(6, 20, true); // version needed
    cdView.setUint16(8, 0, true); // flags
    cdView.setUint16(10, 0, true); // compression
    cdView.setUint16(12, 0, true);
    cdView.setUint16(14, 0, true);
    cdView.setUint32(16, crc, true);
    cdView.setUint32(20, size, true);
    cdView.setUint32(24, size, true);
    cdView.setUint16(28, nameBytes.length, true);
    cdView.setUint16(30, 0, true); // extra
    cdView.setUint16(32, 0, true); // comment
    cdView.setUint16(34, 0, true); // disk
    cdView.setUint16(36, 0, true); // internal attr
    cdView.setUint32(38, 0, true); // external attr
    cdView.setUint32(42, offset, true); // relative offset
    cdHeader.set(nameBytes, 46);

    centralDir.push(cdHeader);
    offset += localHeader.length + fileBytes.length;
  }

  const cdOffset = offset;
  let cdSize = 0;
  centralDir.forEach(cd => { cdSize += cd.length; });

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true); // disk num
  eocdView.setUint16(6, 0, true); // start disk
  eocdView.setUint16(8, files.length, true); // total entries disk
  eocdView.setUint16(10, files.length, true); // total entries
  eocdView.setUint32(12, cdSize, true);
  eocdView.setUint32(16, cdOffset, true);
  eocdView.setUint16(20, 0, true); // comment length

  return new Blob([...parts, ...centralDir, eocd], { type: 'application/zip' });
}

function crc32(bytes) {
  let c = 0 ^ (-1);
  for (let i = 0; i < bytes.length; i++) {
    c = (c >>> 8) ^ CRC_TABLE[(c ^ bytes[i]) & 0xFF];
  }
  return (c ^ (-1)) >>> 0;
}

const CRC_TABLE = (() => {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }
  return table;
})();


// ============================================================
// 8. СИНХРОНИЗАЦИЯ ФОРМ И РЕНДЕРИНГ ДАННЫХ
// ============================================================

async function loadSiteContent() {
  try {
    const res = await fetch('../data/site-content.json');
    if (!res.ok) throw new Error('Не удалось загрузить data/site-content.json');
    const data = await res.json();
    window.AdminState.data = data;

    const totalRooms = data.projects.reduce((acc, p) => acc + (p.rooms ? p.rooms.length : 0), 0);
    let totalRenders = 0;
    data.projects.forEach(p => {
      (p.rooms || []).forEach(r => {
        (r.items || []).forEach(it => {
          if (it.type === 'diptych') totalRenders += 2;
          else totalRenders += 1;
        });
      });
    });

    const statsElem = document.getElementById('globalStatsText');
    if (statsElem) {
      statsElem.textContent = `База данных активна: ${data.projects.length} проектов, ${totalRooms} помещений, ${totalRenders} рендеров`;
    }

    renderTab1Texts(data);
    renderTab2Reorder(data);
    renderTab3Builder(data);
    populatePreviewPages(data);

    showToast('База данных успешно инициализирована', 'success');
  } catch (err) {
    console.error(err);
    showToast('Ошибка загрузки: ' + err.message, 'error');
  }
}

function syncFormDataToState() {
  const data = window.AdminState.data;
  if (!data) return;

  // 1. Home Hero
  if (data.home && data.home.hero) {
    const hTitle = document.getElementById('homeHeroTitle');
    const hDesc = document.getElementById('homeHeroDescription');
    const hBtn = document.getElementById('homeHeroButton');
    if (hTitle) data.home.hero.title = hTitle.value.trim();
    if (hDesc) data.home.hero.description = hDesc.value.trim();
    if (hBtn) data.home.hero.buttonText = hBtn.value.trim();
  }

  // Services
  const srvNames = document.querySelectorAll('.srv-name');
  const srvDescs = document.querySelectorAll('.srv-desc');
  const srvPrices = document.querySelectorAll('.srv-price');
  (data.home.services || []).forEach((srv, i) => {
    if (srvNames[i]) srv.name = srvNames[i].value.trim();
    if (srvDescs[i]) srv.desc = srvDescs[i].value.trim();
    if (srvPrices[i]) srv.price = srvPrices[i].value.trim();
  });

  // Manifesto & Stats
  const manInput = document.getElementById('homeAboutManifesto');
  if (manInput) data.home.aboutSection.manifesto = manInput.value.trim();

  const statTargets = document.querySelectorAll('.stat-target');
  const statSuffixes = document.querySelectorAll('.stat-suffix');
  const statLabels = document.querySelectorAll('.stat-label');
  (data.home.aboutSection.stats || []).forEach((st, i) => {
    if (statTargets[i]) st.target = statTargets[i].value.trim();
    if (statSuffixes[i]) st.suffix = statSuffixes[i].value.trim();
    if (statLabels[i]) st.label = statLabels[i].value.trim();
  });

  // About Page
  const abTitle = document.getElementById('aboutPageTitle');
  const abBadge = document.getElementById('aboutPageBadge');
  const abLead = document.getElementById('aboutPageLead');
  const abSuper = document.getElementById('aboutSupervision');
  const abGeo = document.getElementById('aboutGeo');
  if (abTitle) data.aboutPage.title = abTitle.value.trim();
  if (abBadge) data.aboutPage.badge = abBadge.value.trim();
  if (abLead) data.aboutPage.lead = abLead.value.trim();
  if (abSuper) data.aboutPage.supervisionHtml = abSuper.value.trim();
  if (abGeo) data.aboutPage.geoHtml = abGeo.value.trim();

  // Steps
  const stepTitles = document.querySelectorAll('.step-title');
  const stepTexts = document.querySelectorAll('.step-text');
  (data.aboutPage.steps || []).forEach((stp, i) => {
    if (stepTitles[i]) stp.title = stepTitles[i].value.trim();
    if (stepTexts[i]) stp.text = stepTexts[i].value.trim();
  });

  // Contacts
  const cIntro = document.getElementById('contactsIntro');
  const cLoc = document.getElementById('contactsLocation');
  const cPhone = document.getElementById('contactsPhone');
  const cEmail = document.getElementById('contactsEmail');
  if (cIntro) data.home.contacts.intro = cIntro.value.trim();
  if (cLoc) data.home.contacts.location = cLoc.value.trim();
  if (cPhone) {
    data.home.contacts.phone = cPhone.value.trim();
    data.home.contacts.phoneHref = 'tel:' + cPhone.value.replace(/[^0-9+]/g, '');
  }
  if (cEmail) data.home.contacts.email = cEmail.value.trim();

  // Active Project Passport
  const curProj = data.projects.find(p => p.id === window.AdminState.activeProjectId);
  if (curProj) {
    const pTitle = document.getElementById('projTitle');
    const pFn = document.getElementById('projFilename');
    const pFolder = document.getElementById('projFolder');
    const pCity = document.getElementById('projCity');
    const pArea = document.getElementById('projArea');
    const pMeta = document.getElementById('projMetaDesc');
    const pCoords = document.getElementById('projCoords');

    if (pTitle) { curProj.title = pTitle.value.trim(); curProj.cardTitle = curProj.title; }
    if (pFn) curProj.filename = pFn.value.trim();
    if (pFolder) curProj.folder = pFolder.value.trim();
    if (pCity) { curProj.city = pCity.value.trim(); curProj.cardCity = curProj.city; curProj.mapCity = curProj.city; }
    if (pArea) curProj.area = parseInt(pArea.value, 10) || curProj.area;
    if (pMeta) curProj.metaDesc = pMeta.value.trim();
    if (pCoords && pCoords.value.includes(',')) {
      curProj.coords = pCoords.value.split(',').map(s => parseFloat(s.trim()));
    }
  }
}

// РЕНДЕР ВКЛАДКИ 1: ТЕКСТЫ
function renderTab1Texts(data) {
  const home = data.home || {};
  if (home.hero) {
    document.getElementById('homeHeroTitle').value = home.hero.title || '';
    document.getElementById('homeHeroButton').value = home.hero.buttonText || '';
    document.getElementById('homeHeroDescription').value = home.hero.description || '';
  }

  // Услуги
  const sContainer = document.getElementById('servicesEditorContainer');
  sContainer.innerHTML = '';
  (home.services || []).forEach((srv, idx) => {
    const card = document.createElement('div');
    card.className = 'service-editor-card';
    card.innerHTML = `
      <div class="service-card-badge">${srv.num || `0${idx+1}`}</div>
      <div class="form-group">
        <label class="form-label">Название услуги</label>
        <input type="text" class="admin-input srv-name" value="${escapeHtml(srv.name || '')}">
      </div>
      <div class="form-group" style="margin-top: 10px;">
        <label class="form-label">Описание</label>
        <textarea class="admin-textarea srv-desc" rows="3">${escapeHtml(srv.desc || '')}</textarea>
      </div>
      <div class="form-group" style="margin-top: 10px;">
        <label class="form-label">Цена</label>
        <input type="text" class="admin-input srv-price" value="${escapeHtml(srv.price || '')}">
      </div>
    `;
    sContainer.appendChild(card);
  });

  // Манифест и статистика
  if (home.aboutSection) {
    document.getElementById('homeAboutManifesto').value = home.aboutSection.manifesto || '';
    const statsContainer = document.getElementById('statsEditorContainer');
    statsContainer.innerHTML = '';
    (home.aboutSection.stats || []).forEach(st => {
      const sCard = document.createElement('div');
      sCard.className = 'stat-editor-card';
      sCard.innerHTML = `
        <div class="form-group">
          <label class="form-label">Число (Target)</label>
          <input type="text" class="admin-input stat-target" value="${escapeHtml(st.target || '')}">
        </div>
        <div class="form-group" style="margin-top: 8px;">
          <label class="form-label">Суффикс</label>
          <input type="text" class="admin-input stat-suffix" value="${escapeHtml(st.suffix || '')}">
        </div>
        <div class="form-group" style="margin-top: 8px;">
          <label class="form-label">Подпись</label>
          <input type="text" class="admin-input stat-label" value="${escapeHtml(st.label || '')}">
        </div>
      `;
      statsContainer.appendChild(sCard);
    });
  }

  // О студии
  const about = data.aboutPage || {};
  document.getElementById('aboutPageTitle').value = about.title || '';
  document.getElementById('aboutPageBadge').value = about.badge || '';
  document.getElementById('aboutPageLead').value = about.lead || '';
  document.getElementById('aboutSupervision').value = about.supervisionHtml || '';
  document.getElementById('aboutGeo').value = about.geoHtml || '';

  const stepsContainer = document.getElementById('stepsEditorContainer');
  stepsContainer.innerHTML = '';
  (about.steps || []).forEach(step => {
    const stepCard = document.createElement('div');
    stepCard.className = 'step-editor-card';
    stepCard.innerHTML = `
      <div style="font-family: var(--font-title); font-size: 13px; font-weight: 700; color: var(--accent-amber); margin-bottom: 8px;">${step.num || ''}</div>
      <div class="form-group">
        <label class="form-label">Название этапа</label>
        <input type="text" class="admin-input step-title" value="${escapeHtml(step.title || '')}">
      </div>
      <div class="form-group" style="margin-top: 10px;">
        <label class="form-label">Описание</label>
        <textarea class="admin-textarea step-text" rows="3">${escapeHtml(step.text || '')}</textarea>
      </div>
    `;
    stepsContainer.appendChild(stepCard);
  });

  renderFaqList(about.faq || []);
  document.getElementById('btnAddFaqItem').onclick = () => {
    about.faq = about.faq || [];
    about.faq.push({ question: 'Новый вопрос', answer: 'Ответ на вопрос...' });
    renderFaqList(about.faq);
  };

  // Контакты
  const contacts = home.contacts || {};
  document.getElementById('contactsIntro').value = contacts.intro || '';
  document.getElementById('contactsLocation').value = contacts.location || '';
  document.getElementById('contactsPhone').value = contacts.phone || '';
  document.getElementById('contactsEmail').value = contacts.email || '';
}

function renderFaqList(faqArray) {
  const container = document.getElementById('faqListContainer');
  container.innerHTML = '';
  faqArray.forEach((faq, index) => {
    const item = document.createElement('div');
    item.className = 'faq-item-card';
    item.innerHTML = `
      <div class="faq-item-number">${index + 1}</div>
      <div class="faq-item-fields">
        <input type="text" class="admin-input faq-question" value="${escapeHtml(faq.question || '')}" placeholder="Вопрос">
        <textarea class="admin-textarea faq-answer" rows="2" placeholder="Ответ">${escapeHtml(faq.answer || '')}</textarea>
      </div>
      <button class="btn btn-icon btn-danger btn-delete-faq" title="Удалить вопрос">×</button>
    `;
    item.querySelector('.btn-delete-faq').onclick = () => {
      faqArray.splice(index, 1);
      renderFaqList(faqArray);
    };
    container.appendChild(item);
  });
}

// РЕНДЕР ВКЛАДКИ 2: ПОРЯДОК ПРОЕКТОВ
function renderTab2Reorder(data) {
  const homeOrder = data.homeProjectsOrder || [];
  const allOrder = data.allProjectsOrder || [];
  const projectsMap = {};
  (data.projects || []).forEach(p => { projectsMap[p.filename] = p; });

  const mainSlots = document.getElementById('homeMainGridSlots');
  const peekSlots = document.getElementById('homePeekSlots');
  mainSlots.innerHTML = '';
  peekSlots.innerHTML = '';

  homeOrder.forEach((fn, idx) => {
    const proj = projectsMap[fn] || { title: fn, filename: fn, cardCity: '', area: 0, specsCategory: '' };
    const card = createHomeOrderCard(proj, idx, homeOrder, data.projects);
    if (idx < 4) mainSlots.appendChild(card);
    else peekSlots.appendChild(card);
  });

  const catalogContainer = document.getElementById('allProjectsCatalogList');
  catalogContainer.innerHTML = '';
  document.getElementById('catalogProjectsTotalBadge').textContent = `${allOrder.length} проектов`;

  allOrder.forEach((fn, idx) => {
    const proj = projectsMap[fn] || { title: fn, filename: fn, cardCity: '', area: 0, specsCategory: '' };
    const card = createAllProjectsOrderCard(proj, idx, allOrder, data.projects);
    catalogContainer.appendChild(card);
  });
}

function createHomeOrderCard(proj, index, orderArray, allProjects) {
  const card = document.createElement('div');
  card.className = 'reorder-card';
  const thumb = proj.cardImage ? `../${proj.cardImage}` : (proj.heroDay ? `../${proj.heroDay}` : '');

  card.innerHTML = `
    <div class="reorder-slot-num">${index + 1}</div>
    <img src="${thumb}" alt="${escapeHtml(proj.title)}" class="reorder-thumb" onerror="this.src='../images/logo.png'">
    <div class="reorder-info">
      <div class="reorder-title">${escapeHtml(proj.title)}</div>
      <div class="reorder-meta">
        <span>${escapeHtml(proj.cardCity || proj.city || '')}</span>
        <span>•</span>
        <span>${proj.area || 0} м²</span>
      </div>
    </div>
    <div class="reorder-actions">
      <select class="slot-select-dropdown" title="Заменить проект в этом слоте">
        ${allProjects.map(p => `
          <option value="${p.filename}" ${p.filename === proj.filename ? 'selected' : ''}>
            ${escapeHtml(p.title)}
          </option>
        `).join('')}
      </select>
      <button class="btn-icon btn-move-up" title="Переместить вверх" ${index === 0 ? 'disabled style="opacity:0.3"' : ''}>↑</button>
      <button class="btn-icon btn-move-down" title="Переместить вниз" ${index === orderArray.length - 1 ? 'disabled style="opacity:0.3"' : ''}>↓</button>
    </div>
  `;

  card.querySelector('.slot-select-dropdown').onchange = (e) => {
    orderArray[index] = e.target.value;
    renderTab2Reorder(window.AdminState.data);
    showToast(`Слот ${index + 1} обновлен`, 'success');
  };

  const btnUp = card.querySelector('.btn-move-up');
  if (btnUp && index > 0) {
    btnUp.onclick = () => {
      const temp = orderArray[index];
      orderArray[index] = orderArray[index - 1];
      orderArray[index - 1] = temp;
      renderTab2Reorder(window.AdminState.data);
    };
  }

  const btnDown = card.querySelector('.btn-move-down');
  if (btnDown && index < orderArray.length - 1) {
    btnDown.onclick = () => {
      const temp = orderArray[index];
      orderArray[index] = orderArray[index + 1];
      orderArray[index + 1] = temp;
      renderTab2Reorder(window.AdminState.data);
    };
  }

  return card;
}

function createAllProjectsOrderCard(proj, index, orderArray) {
  const card = document.createElement('div');
  card.className = 'reorder-card';
  card.draggable = true;
  const thumb = proj.cardImage ? `../${proj.cardImage}` : (proj.heroDay ? `../${proj.heroDay}` : '');

  card.innerHTML = `
    <span class="reorder-handle">⋮⋮</span>
    <div class="reorder-slot-num">${index + 1}</div>
    <img src="${thumb}" alt="${escapeHtml(proj.title)}" class="reorder-thumb" onerror="this.src='../images/logo.png'">
    <div class="reorder-info">
      <div class="reorder-title">${escapeHtml(proj.title)}</div>
      <div class="reorder-meta">
        <span class="badge ${proj.filterCategory === 'houses' ? 'badge-amber' : proj.filterCategory === 'commercial' ? 'badge-green' : 'badge-muted'}" style="font-size: 10px; padding: 2px 6px;">
          ${escapeHtml(proj.specsCategory || proj.badgeLabel || 'Квартира')}
        </span>
        <span>${escapeHtml(proj.cardCity || proj.city || '')}</span>
        <span>•</span>
        <span>${proj.area || 0} м²</span>
      </div>
    </div>
    <div class="reorder-actions">
      <button class="btn-icon btn-move-up" title="Переместить вверх" ${index === 0 ? 'disabled style="opacity:0.3"' : ''}>↑</button>
      <button class="btn-icon btn-move-down" title="Переместить вниз" ${index === orderArray.length - 1 ? 'disabled style="opacity:0.3"' : ''}>↓</button>
    </div>
  `;

  const btnUp = card.querySelector('.btn-move-up');
  if (btnUp && index > 0) {
    btnUp.onclick = () => {
      const temp = orderArray[index];
      orderArray[index] = orderArray[index - 1];
      orderArray[index - 1] = temp;
      renderTab2Reorder(window.AdminState.data);
    };
  }

  const btnDown = card.querySelector('.btn-move-down');
  if (btnDown && index < orderArray.length - 1) {
    btnDown.onclick = () => {
      const temp = orderArray[index];
      orderArray[index] = orderArray[index + 1];
      orderArray[index + 1] = temp;
      renderTab2Reorder(window.AdminState.data);
    };
  }

  card.addEventListener('dragstart', (e) => {
    card.classList.add('is-dragging');
    e.dataTransfer.setData('text/plain', index);
  });
  card.addEventListener('dragend', () => card.classList.remove('is-dragging'));
  card.addEventListener('dragover', (e) => e.preventDefault());
  card.addEventListener('drop', (e) => {
    e.preventDefault();
    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
    const toIdx = index;
    if (!isNaN(fromIdx) && fromIdx !== toIdx) {
      const item = orderArray.splice(fromIdx, 1)[0];
      orderArray.splice(toIdx, 0, item);
      renderTab2Reorder(window.AdminState.data);
      showToast('Порядок проектов в каталоге обновлен', 'info');
    }
  });

  return card;
}

// РЕНДЕР ВКЛАДКИ 3: КОНСТРУКТОР ПРОЕКТОВ И ПОМЕЩЕНИЙ
function renderTab3Builder(data) {
  renderProjectsSidebar(data.projects || []);

  if (data.projects && data.projects.length > 0) {
    const targetProj = data.projects.find(p => p.id === window.AdminState.activeProjectId) || data.projects[0];
    selectProjectInBuilder(targetProj);
  }

  const searchInput = document.getElementById('projectSearchInput');
  searchInput.oninput = () => {
    const q = searchInput.value.toLowerCase().trim();
    const filtered = (data.projects || []).filter(p => 
      (p.title && p.title.toLowerCase().includes(q)) || 
      (p.city && p.city.toLowerCase().includes(q)) ||
      (p.filename && p.filename.toLowerCase().includes(q))
    );
    renderProjectsSidebar(filtered);
  };

  document.getElementById('btnCreateNewProject').onclick = createNewProjectDialog;
}

function renderProjectsSidebar(projectsList) {
  const container = document.getElementById('sidebarProjectsList');
  container.innerHTML = '';

  projectsList.forEach(proj => {
    const btn = document.createElement('button');
    btn.className = `project-item-btn ${proj.id === window.AdminState.activeProjectId ? 'active' : ''}`;
    const thumb = proj.cardImage ? `../${proj.cardImage}` : (proj.heroDay ? `../${proj.heroDay}` : '');
    const roomCount = proj.rooms ? proj.rooms.length : 0;

    btn.innerHTML = `
      <img src="${thumb}" alt="${escapeHtml(proj.title)}" class="project-item-thumb" onerror="this.src='../images/logo.png'">
      <div class="project-item-details">
        <div class="project-item-name">${escapeHtml(proj.title)}</div>
        <div class="project-item-sub">
          <span>${escapeHtml(proj.city || '')}</span>
          <span>•</span>
          <span class="room-count-badge">${roomCount} комнат</span>
        </div>
      </div>
    `;

    btn.onclick = () => selectProjectInBuilder(proj);
    container.appendChild(btn);
  });
}

function selectProjectInBuilder(proj) {
  window.AdminState.activeProjectId = proj.id;

  document.querySelectorAll('.project-item-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = Array.from(document.querySelectorAll('.project-item-btn')).find(b => 
    b.querySelector('.project-item-name')?.textContent === proj.title
  );
  if (activeBtn) activeBtn.classList.add('active');

  document.getElementById('activeProjectTitleHeader').textContent = proj.title;
  document.getElementById('activeProjectCategoryBadge').textContent = proj.specsCategory || proj.badgeLabel || 'Квартира';
  document.getElementById('activeProjectFilenameBadge').textContent = proj.filename;
  document.getElementById('activeProjectFolderBadge').textContent = `images/${proj.folder}`;

  document.getElementById('projTitle').value = proj.title || '';
  document.getElementById('projFilename').value = proj.filename || '';
  document.getElementById('projFolder').value = proj.folder || '';
  document.getElementById('projCity').value = proj.city || '';
  document.getElementById('projArea').value = proj.area || '';
  document.getElementById('projMetaDesc').value = proj.metaDesc || '';
  document.getElementById('projCoords').value = (proj.coords && proj.coords.length === 2) ? proj.coords.join(', ') : '';

  // Категория 3-radio
  const catCards = document.querySelectorAll('.category-radio-card');
  catCards.forEach(card => {
    card.classList.remove('active');
    if (card.dataset.categoryType === proj.filterCategory) card.classList.add('active');
    card.onclick = () => {
      catCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const cat = card.dataset.categoryType;
      if (cat === 'flats') {
        proj.filterCategory = 'flats';
        proj.specsCategory = 'Квартира';
        proj.badgeLabel = 'Жилая квартира';
      } else if (cat === 'houses') {
        proj.filterCategory = 'houses';
        proj.specsCategory = 'Загородный дом';
        proj.badgeLabel = 'Загородный дом';
      } else if (cat === 'commercial') {
        proj.filterCategory = 'commercial';
        proj.specsCategory = 'Коммерческий объект';
        proj.badgeLabel = 'Коммерческий объект';
      }
      document.getElementById('activeProjectCategoryBadge').textContent = proj.specsCategory;
    };
  });

  // Быстрые пресеты гео
  document.querySelectorAll('.geo-preset-chip').forEach(chip => {
    chip.onclick = () => {
      document.getElementById('projCoords').value = chip.dataset.coords;
      proj.coords = chip.dataset.coords.split(',').map(s => parseFloat(s.trim()));
      showToast(`Координаты обновлены: ${chip.textContent}`, 'info');
    };
  });

  // Дневная обложка
  const dayImg = document.getElementById('dayCoverImgPreview');
  const dayPath = document.getElementById('dayCoverPath');
  const dayName = document.getElementById('dayCoverName');
  if (proj.heroDay) {
    dayImg.src = `../${proj.heroDay}`;
    dayPath.textContent = proj.heroDay;
    dayName.textContent = proj.heroDay.split('/').pop();
  }

  // Ночная обложка
  const nightBanner = document.getElementById('nightCoverStatusBanner');
  const nightBox = document.getElementById('nightCoverPreviewBox');
  const nightImg = document.getElementById('nightCoverImgPreview');
  const nightPath = document.getElementById('nightCoverPath');
  const nightName = document.getElementById('nightCoverName');

  if (proj.heroNight) {
    nightBanner.className = 'night-cover-status-banner active';
    nightBanner.innerHTML = '<span>✓ Ночная обложка активна: на странице будет отображен переключатель освещения ДЕНЬ / НОЧЬ</span>';
    nightBox.style.display = 'flex';
    nightImg.src = `../${proj.heroNight}`;
    nightPath.textContent = proj.heroNight;
    nightName.textContent = proj.heroNight.split('/').pop();
  } else {
    nightBanner.className = 'night-cover-status-banner empty';
    nightBanner.innerHTML = '<span>○ Переключатель ДЕНЬ / НОЧЬ скрыт (только дневной режим)</span>';
    nightBox.style.display = 'none';
  }

  document.getElementById('btnRemoveNightCover').onclick = () => {
    proj.heroNight = null;
    nightBanner.className = 'night-cover-status-banner empty';
    nightBanner.innerHTML = '<span>○ Переключатель ДЕНЬ / НОЧЬ скрыт (только дневной режим)</span>';
    nightBox.style.display = 'none';
    showToast('Ночная обложка удалена', 'info');
  };

  setupDropzonesForProject(proj);
  renderProjectRooms(proj);
}

function renderProjectRooms(proj) {
  const container = document.getElementById('roomsListContainer');
  container.innerHTML = '';
  const rooms = proj.rooms || [];
  document.getElementById('projectRoomsCountBadge').textContent = `${rooms.length} помещений`;

  rooms.forEach((room, rIdx) => {
    const roomCard = createRoomCard(room, rIdx, proj);
    container.appendChild(roomCard);
  });

  const handleAddRoom = () => {
    const newRoom = {
      id: `room-${Date.now()}`,
      name: 'Новое помещение',
      nav: 'Новое',
      prefix: 'room',
      items: []
    };
    rooms.push(newRoom);
    renderProjectRooms(proj);
    showToast('Помещение добавлено', 'success');
  };

  document.getElementById('btnAddRoomTop').onclick = handleAddRoom;
  document.getElementById('btnAddRoomBottom').onclick = handleAddRoom;
}

function createRoomCard(room, roomIndex, proj) {
  const card = document.createElement('div');
  card.className = 'room-block-card';

  card.innerHTML = `
    <div class="room-block-header">
      <div class="room-block-title-wrap">
        <span class="room-block-index">${roomIndex + 1}</span>
        <div class="room-block-heading">${escapeHtml(room.name || 'Помещение')}</div>
      </div>
      <div class="room-block-actions">
        <button class="btn-icon btn-room-up" title="Переместить вверх" ${roomIndex === 0 ? 'disabled style="opacity:0.3"' : ''}>↑</button>
        <button class="btn-icon btn-room-down" title="Переместить вниз" ${roomIndex === (proj.rooms.length - 1) ? 'disabled style="opacity:0.3"' : ''}>↓</button>
        <button class="btn btn-sm btn-danger btn-room-delete" title="Удалить помещение">Удалить</button>
      </div>
    </div>

    <div class="room-meta-fields">
      <div class="form-group">
        <label class="form-label">Название помещения (заголовок h2.room-name)</label>
        <input type="text" class="admin-input room-input-name" value="${escapeHtml(room.name || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Кратко для нижнего меню #hwRoomNav</label>
        <input type="text" class="admin-input room-input-nav" value="${escapeHtml(room.nav || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Префикс файлов</label>
        <input type="text" class="admin-input room-input-prefix" value="${escapeHtml(room.prefix || '')}">
      </div>
    </div>

    <div class="dropzone-box dropzone-renders" style="padding: 16px; margin-bottom: 16px;">
      <div class="dropzone-icon" style="font-size: 22px; margin-bottom: 4px;">🖼</div>
      <div class="dropzone-title">Приложите ниже рендеры данного помещения (JPG, PNG, WebP)</div>
      <div class="dropzone-hint">Изображения автоматически конвертируются в WebP и нумеруются с префиксом «${room.prefix || 'render'}»</div>
      <input type="file" class="dropzone-input-hidden input-room-render-files" multiple accept="image/*">
    </div>

    <div class="room-renders-grid">
      <!-- Сетка рендеров -->
    </div>
  `;

  // Реактивные инпуты
  const nameInput = card.querySelector('.room-input-name');
  nameInput.oninput = () => {
    room.name = nameInput.value;
    card.querySelector('.room-block-heading').textContent = room.name || 'Помещение';
  };

  const navInput = card.querySelector('.room-input-nav');
  navInput.oninput = () => { room.nav = navInput.value; };

  const prefixInput = card.querySelector('.room-input-prefix');
  prefixInput.oninput = () => { room.prefix = prefixInput.value; };

  // Перемещение и удаление
  const btnUp = card.querySelector('.btn-room-up');
  if (btnUp && roomIndex > 0) {
    btnUp.onclick = () => {
      const temp = proj.rooms[roomIndex];
      proj.rooms[roomIndex] = proj.rooms[roomIndex - 1];
      proj.rooms[roomIndex - 1] = temp;
      renderProjectRooms(proj);
    };
  }

  const btnDown = card.querySelector('.btn-room-down');
  if (btnDown && roomIndex < proj.rooms.length - 1) {
    btnDown.onclick = () => {
      const temp = proj.rooms[roomIndex];
      proj.rooms[roomIndex] = proj.rooms[roomIndex + 1];
      proj.rooms[roomIndex + 1] = temp;
      renderProjectRooms(proj);
    };
  }

  card.querySelector('.btn-room-delete').onclick = () => {
    if (confirm(`Удалить помещение «${room.name}» и все его ракурсы?`)) {
      proj.rooms.splice(roomIndex, 1);
      renderProjectRooms(proj);
      showToast('Помещение удалено', 'info');
    }
  };

  // Дропзона рендеров комнаты
  const dropzoneRenders = card.querySelector('.dropzone-renders');
  const inputRenders = card.querySelector('.input-room-render-files');
  const gridContainer = card.querySelector('.room-renders-grid');

  dropzoneRenders.onclick = () => inputRenders.click();
  dropzoneRenders.ondragover = (e) => { e.preventDefault(); dropzoneRenders.classList.add('dragover'); };
  dropzoneRenders.ondragleave = () => dropzoneRenders.classList.remove('dragover');
  dropzoneRenders.ondrop = async (e) => {
    e.preventDefault();
    dropzoneRenders.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      await handleRoomRendersUpload(proj, room, Array.from(e.dataTransfer.files), gridContainer);
    }
  };
  inputRenders.onchange = async () => {
    if (inputRenders.files.length > 0) {
      await handleRoomRendersUpload(proj, room, Array.from(inputRenders.files), gridContainer);
    }
  };

  renderRoomItems(room, gridContainer, proj);
  return card;
}

function renderRoomItems(room, gridContainer, proj) {
  gridContainer.innerHTML = '';
  const items = room.items || [];

  items.forEach((item, itemIdx) => {
    if (item.type === 'diptych' && item.items && item.items.length === 2) {
      item.items.forEach((dipSubItem, subIdx) => {
        const [src, cap] = dipSubItem;
        const card = createRenderCard(src, cap, 'diptych', itemIdx, subIdx, room, proj);
        gridContainer.appendChild(card);
      });
    } else {
      const card = createRenderCard(item.src, item.cap, item.type || 'full', itemIdx, null, room, proj);
      gridContainer.appendChild(card);
    }
  });
}

function createRenderCard(src, cap, layoutType, itemIdx, subIdx, room, proj) {
  const card = document.createElement('div');
  card.className = 'render-item-card';
  const filename = src ? src.split('/').pop() : 'render.webp';
  const imgSrc = src.startsWith('blob:') || src.startsWith('data:') ? src : `../${src}`;

  card.innerHTML = `
    <div class="render-item-thumb-box">
      <img src="${imgSrc}" alt="${escapeHtml(cap || '')}" class="render-item-img" onerror="this.src='../images/logo.png'">
      <div class="render-item-badges">
        <span class="render-badge-webp">WEBP</span>
      </div>
      <div class="render-item-actions-top">
        <button class="render-btn-sm render-btn-left" title="Переместить левее">←</button>
        <button class="render-btn-sm render-btn-right" title="Переместить правее">→</button>
        <button class="render-btn-sm render-btn-delete" title="Удалить ракурс">×</button>
      </div>
    </div>
    <div class="render-item-body">
      <div class="render-item-filename" title="${escapeHtml(src)}">${escapeHtml(filename)}</div>
      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label" style="font-size: 10px;">Подпись ракурса (alt / figcaption)</label>
        <input type="text" class="admin-input render-item-caption-input" value="${escapeHtml(cap || '')}" placeholder="Описание ракурса...">
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label" style="font-size: 10px;">Раскладка на странице</label>
        <select class="admin-select render-layout-select">
          <option value="auto" ${layoutType === 'auto' ? 'selected' : ''}>Авто по эталону Макаровского</option>
          <option value="diptych" ${layoutType === 'diptych' ? 'selected' : ''}>По 2 в ряд (.diptych-grid)</option>
          <option value="full" ${layoutType === 'full' ? 'selected' : ''}>Во всю ширину (.media-block)</option>
          <option value="full_compact" ${layoutType === 'full_compact' ? 'selected' : ''}>Компактный по центру 800px</option>
        </select>
      </div>
    </div>
  `;

  // Подпись
  const capInput = card.querySelector('.render-item-caption-input');
  capInput.oninput = () => {
    if (subIdx !== null && room.items[itemIdx]?.items?.[subIdx]) {
      room.items[itemIdx].items[subIdx][1] = capInput.value;
    } else if (room.items[itemIdx]) {
      room.items[itemIdx].cap = capInput.value;
    }
  };

  // Переключатель раскладки
  const layoutSel = card.querySelector('.render-layout-select');
  layoutSel.onchange = () => {
    if (room.items[itemIdx]) {
      room.items[itemIdx].type = layoutSel.value;
      showToast('Тип раскладки обновлен', 'info');
    }
  };

  // Удаление кадра
  card.querySelector('.render-btn-delete').onclick = () => {
    if (confirm('Удалить данный ракурс из помещения?')) {
      room.items.splice(itemIdx, 1);
      renderProjectRooms(proj);
      showToast('Ракурс удален', 'info');
    }
  };

  return card;
}

function createNewProjectDialog() {
  const title = prompt('Введите название нового проекта (например: ЖК «Кандинский»):');
  if (!title || !title.trim()) return;

  const slug = title.toLowerCase().replace(/[^a-zа-я0-9]/gi, '-').replace(/-+/g, '-');
  const newProj = {
    id: `project-${Date.now()}`,
    filename: `project-${slug}.html`,
    folder: slug.toUpperCase(),
    title: title.trim(),
    cardTitle: title.trim(),
    city: 'Екатеринбург',
    cardCity: 'Екатеринбург',
    mapCity: 'Екатеринбург',
    coords: [56.8519, 60.6122],
    specsCategory: 'Квартира',
    filterCategory: 'flats',
    badgeLabel: 'Жилая квартира',
    area: 90,
    year: '2026',
    heroDay: 'images/logo.png',
    cardImage: 'images/logo.png',
    metaDesc: `Дизайн-проект интерьера ${title} от студии FERRO DESIGN.`,
    rooms: [
      {
        id: 'living',
        name: 'Гостиная',
        nav: 'Гостиная',
        prefix: 'living',
        items: []
      }
    ]
  };

  window.AdminState.data.projects.push(newProj);
  window.AdminState.data.allProjectsOrder.push(newProj.filename);
  renderTab2Reorder(window.AdminState.data);
  renderProjectsSidebar(window.AdminState.data.projects);
  selectProjectInBuilder(newProj);
  showToast(`Проект «${title}» успешно создан!`, 'success');
}

function populatePreviewPages(data) {
  const sel = document.getElementById('previewPageSelector');
  if (!sel) return;
  (data.projects || []).forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.filename;
    opt.textContent = `Проект: ${p.title}`;
    sel.appendChild(opt);
  });
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
