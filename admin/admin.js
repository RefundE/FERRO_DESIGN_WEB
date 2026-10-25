/**
 * FERRO DESIGN™ — ПОЛНЫЙ ДВИЖОК АДМИН-ПАНЕЛИ (ADMIN.JS)
 * Архитектурный минимализм, строгая валидация по 10 правилам verify_all_cases.py,
 * авто-конвертация рендеров в WebP, точные канонические генераторы HTML/XML
 * и публикация через GitHub Git Trees API.
 */

// ============================================================
// 1. СОСТОЯНИЕ ПРИЛОЖЕНИЯ И ИНИЦИАЛИЗАЦИЯ
// ============================================================

window.AdminState = {
  data: null,
  activeTab: 'tab-texts',
  activeTextPage: 'page-home',
  activeProjectId: 'project-makarovsky',
  githubToken: (localStorage.getItem('ferro_gh_token') || '').trim(),
  githubRepo: (localStorage.getItem('ferro_gh_repo') || 'RefundE/FERRO_DESIGN_WEB').trim(),
  githubBranch: (localStorage.getItem('ferro_gh_branch') || 'main').trim(),
  publishLockUntil: parseInt(localStorage.getItem('ferro_publish_lock_until') || '0', 10),
  newFilesMap: new Map(),
  hasUnsavedChanges: false
};

// Защита от потери несохранённых данных при случайном закрытии вкладки
window.addEventListener('beforeunload', (e) => {
  if (window.AdminState && (window.AdminState.hasUnsavedChanges || window.AdminState.newFilesMap.size > 0)) {
    e.preventDefault();
    e.returnValue = 'У вас есть несохранённые или неопубликованные изменения. Вы уверены, что хотите закрыть страницу?';
    return e.returnValue;
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initModals();
  initPublishLockCountdown();
  initZipExport();
  initUnsavedChangesTracker();
  await loadSiteContent();
});

function initUnsavedChangesTracker() {
  ['input', 'change'].forEach(eventType => {
    document.addEventListener(eventType, (e) => {
      if (e.target && typeof e.target.matches === 'function' && e.target.matches('input, textarea, select')) {
        if (!e.target.matches('#projectSearchInput, #previewPageSelector, #ghTokenInput, #ghRepoInput, #ghBranchInput')) {
          window.AdminState.hasUnsavedChanges = true;
        }
      }
    });
  });
}

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
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (res.ok) {
        const d = await res.json();
        statusBox.innerHTML = `<span style="color: var(--success);">✓ Связь установлена: ${escapeHtml(d.full_name)} (${escapeHtml(d.default_branch)})</span>`;
      } else {
        let errDetail = '';
        try {
          const errData = await res.json();
          errDetail = errData.message ? `${errData.message}${errData.errors ? ': ' + JSON.stringify(errData.errors) : ''}` : JSON.stringify(errData);
        } catch (_) {
          errDetail = res.statusText;
        }
        statusBox.innerHTML = `<span style="color: var(--danger);">✕ Ошибка подключения (${res.status}): ${escapeHtml(errDetail)}</span>`;
      }
    } catch (err) {
      statusBox.innerHTML = `<span style="color: var(--danger);">✕ Ошибка сети: ${escapeHtml(err.message)}</span>`;
    }
  });

  document.getElementById('btnConfirmPublishFinal').addEventListener('click', async () => {
    await handleSitePublication();
  });

  setupBuilderGlobalActions();
}

function setupBuilderGlobalActions() {
  const btnDup = document.getElementById('btnDuplicateProject');
  if (btnDup) {
    btnDup.onclick = () => {
      syncFormDataToState();
      const data = window.AdminState.data;
      if (!data || !data.projects || data.projects.length === 0) return;
      const curProj = data.projects.find(p => p.id === window.AdminState.activeProjectId);
      if (!curProj) return;

      const dupProj = JSON.parse(JSON.stringify(curProj));
      const timestamp = Date.now();
      dupProj.id = 'project-' + timestamp;
      const baseSlug = (curProj.filename || 'project').replace(/\.html$/i, '').replace(/^project-/i, '');
      dupProj.filename = `project-${baseSlug}-copy.html`;
      dupProj.title = `${curProj.title} (Копия)`;
      dupProj.cardTitle = dupProj.title;

      data.projects.push(dupProj);
      if (Array.isArray(data.allProjectsOrder)) {
        data.allProjectsOrder.push(dupProj.filename);
      }

      window.AdminState.hasUnsavedChanges = true;
      renderProjectsSidebar(data.projects);
      renderTab2Reorder(data);
      selectProjectInBuilder(dupProj);
      showToast(`Проект продублирован: «${dupProj.title}»`, 'success');
    };
  }

  const btnDel = document.getElementById('btnDeleteProject');
  if (btnDel) {
    btnDel.onclick = () => {
      const data = window.AdminState.data;
      if (!data || !data.projects) return;

      if (data.projects.length <= 1) {
        alert('Запрещено удалять единственный оставшийся проект в каталоге!');
        return;
      }

      const curProj = data.projects.find(p => p.id === window.AdminState.activeProjectId);
      if (!curProj) return;

      if (!confirm(`Вы действительно хотите безвозвратно удалить проект «${curProj.title}» (${curProj.filename})?`)) {
        return;
      }

      const delFilename = curProj.filename;
      const delFolder = curProj.folder;

      // Удаляем из data.projects
      const pIdx = data.projects.findIndex(p => p.id === curProj.id);
      if (pIdx !== -1) {
        data.projects.splice(pIdx, 1);
      }

      // Удаляем из data.allProjectsOrder
      if (Array.isArray(data.allProjectsOrder)) {
        data.allProjectsOrder = data.allProjectsOrder.filter(fn => fn !== delFilename);
      }

      // Удаляем из data.homeProjectsOrder
      if (Array.isArray(data.homeProjectsOrder)) {
        data.homeProjectsOrder = data.homeProjectsOrder.filter(fn => fn !== delFilename);
      }

      // Очищаем из AdminState.newFilesMap файлы, связанные с папкой удаляемого проекта
      if (window.AdminState.newFilesMap && delFolder) {
        for (const key of Array.from(window.AdminState.newFilesMap.keys())) {
          if (key.includes(delFolder)) {
            window.AdminState.newFilesMap.delete(key);
          }
        }
      }

      window.AdminState.hasUnsavedChanges = true;
      const nextProj = data.projects[0];
      renderProjectsSidebar(data.projects);
      renderTab2Reorder(data);
      selectProjectInBuilder(nextProj);
      showToast(`Проект «${curProj.title}» удален`, 'info');
    };
  }
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

async function compressAndConvertToWebP(file, maxSide = 2560, quality = 0.86) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err || new Error('Не удалось прочитать графический файл'));
    };

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.width;
      let height = img.height;

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
        resolve({
          blob,
          dataUrl,
          get base64() {
            return this.dataUrl ? this.dataUrl.slice(this.dataUrl.indexOf(',') + 1) : '';
          },
          width,
          height
        });
      }, 'image/webp', quality);
    };

    img.src = objectUrl;
  });
}

function setupDropzonesForProject(proj) {
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

async function handleRoomRendersUpload(proj, room, files, gridContainer) {
  try {
    showToast(`Конвертация ${files.length} изображений в WebP...`, 'info');
    const prefix = (room.prefix || 'render').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

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
// 3. КАНОНИЧЕСКИЕ ГЕНЕРАТОРЫ СТРАНИЦ САЙТА
// ============================================================

/**
 * 1. Генератор HTML кейса по эталону project-makarovsky.html
 */
function generateProjectPageHTML(project, nextProject, contacts) {
  const titleText = `${project.title} — Студия дизайна интерьера FERRO DESIGN™`;
  const metaDesc = project.metaDesc || `Дизайн-проект интерьера квартиры ${project.area} м² в ${project.title}, ${project.city} от студии FERRO DESIGN.`;
  const absOgImage = project.heroDay.startsWith('http') ? project.heroDay : `https://ferro-design.ru/${project.heroDay}`;

  let roomsHtml = '';
  (project.rooms || []).forEach(room => {
    roomsHtml += `\n    <!-- ==========================================\n         ${room.name.toUpperCase()} (${room.prefix})\n    ========================================== -->\n`;
    roomsHtml += `    <div class="room-header" id="${room.id}">\n`;
    roomsHtml += `      <h2 class="room-name">${escapeHtml(room.name.toUpperCase())}</h2>\n`;
    roomsHtml += `    </div>\n\n`;

    const items = room.items || [];
    items.forEach(it => {
      if (it.type === 'diptych' && it.items && it.items.length === 2) {
        roomsHtml += `    <div class="diptych-grid">\n`;
        it.items.forEach(([src, cap]) => {
          roomsHtml += `      <figure>\n        <div class="js-tilt">\n          <img src="${escapeHtml(src)}" alt="${escapeHtml(cap || '')}" loading="lazy" decoding="async">\n        </div>\n        <figcaption>${escapeHtml(cap || '')}</figcaption>\n      </figure>\n`;
        });
        roomsHtml += `    </div>\n\n`;
      } else if (it.type === 'full_compact') {
        roomsHtml += `    <figure class="media-block" style="max-width: 800px; margin-left: auto; margin-right: auto;">\n      <div class="js-tilt">\n        <img src="${escapeHtml(it.src)}" alt="${escapeHtml(it.cap || '')}" loading="lazy" decoding="async">\n      </div>\n      <figcaption>${escapeHtml(it.cap || '')}</figcaption>\n    </figure>\n\n`;
      } else {
        roomsHtml += `    <figure class="media-block">\n      <div class="js-tilt">\n        <img src="${escapeHtml(it.src)}" alt="${escapeHtml(it.cap || '')}" loading="lazy" decoding="async">\n      </div>\n      <figcaption>${escapeHtml(it.cap || '')}</figcaption>\n    </figure>\n\n`;
      }
    });
  });

  let navLinksHtml = '';
  (project.rooms || []).forEach((room, idx) => {
    navLinksHtml += `      <a href="#${room.id}" class="hw-room-link${idx === 0 ? ' active' : ''}">${escapeHtml(room.nav)}</a>\n`;
  });

  let lightingHtml = '';
  let heroNightImgHtml = '';
  if (project.heroNight) {
    heroNightImgHtml = `\n      <img src="${escapeHtml(project.heroNight)}" alt="${escapeHtml(project.title)} — Вечерний сценарий" class="hero-bg-layer hero-bg-night">`;
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

  const projectSchemaJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": `Дизайн интерьера ${project.title}`,
    "description": metaDesc,
    "creator": {
      "@type": "HomeAndConstructionBusiness",
      "name": "FERRO DESIGN™"
    }
  }, null, 2);

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
  <meta property="og:image" content="${escapeHtml(absOgImage)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(titleText)}">
  <meta name="twitter:description" content="${escapeHtml(metaDesc)}">
  <meta name="twitter:image" content="${escapeHtml(absOgImage)}">

  <link rel="icon" id="dynamicFavicon" type="image/png" href="favicon.png">
  <link rel="stylesheet" href="style.css?v=2">

  <script type="application/ld+json">
${projectSchemaJson}
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
      <img src="${escapeHtml(project.heroDay)}" alt="${escapeHtml(project.title)} — Дневной сценарий" class="hero-bg-layer hero-bg-day" fetchpriority="high">${heroNightImgHtml}
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
      <a href="${escapeHtml(nextProject.filename)}" class="next-title">
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
            ${escapeHtml(contacts.intro || 'Готовы обсудить ваш проект? Свяжитесь с нами удобным для вас способом.')}
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

        <div class="contact-col-direct">
          <div class="contact-direct-card">
            <h3 class="contact-direct-title">Быстрая связь</h3>
            <p class="contact-direct-desc">
              Напишите напрямую основателю студии в мессенджере или позвоните — ответим на все вопросы и сориентируем по срокам и стоимости.
            </p>

            <div class="contact-direct-schedule">
              <span class="direct-schedule-dot" aria-hidden="true"></span>
              <span class="direct-schedule-text">Пн — Вс: 10:00 — 20:00 • Екатеринбург и удаленно по всей России</span>
            </div>

            <div class="contact-direct-actions">
              <a href="https://t.me/ferrodesign_ekb" target="_blank" rel="noopener" class="direct-action-btn direct-btn-telegram">
                <svg class="direct-btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.62 3.72-.53.37-1.01.55-1.44.54-.48-.01-1.4-.27-2.08-.49-.84-.27-1.5-.42-1.44-.88.03-.24.38-.49 1.03-.75 4.04-1.76 6.74-2.92 8.09-3.5 3.86-1.61 4.66-1.89 5.19-1.9.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.19-.04.35z"/>
                </svg>
                <span class="direct-btn-text">Написать в Telegram</span>
                <span class="direct-btn-arrow">→</span>
              </a>

              <a href="https://wa.me/${contacts.phone ? contacts.phone.replace(/[^0-9]/g, '') : '79634426192'}" target="_blank" rel="noopener" class="direct-action-btn direct-btn-whatsapp">
                <svg class="direct-btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.96.57 3.88 1.66 5.53L2 22l4.73-1.68c1.58.97 3.4 1.59 5.31 1.59 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm0 18.09c-1.67 0-3.29-.49-4.68-1.41l-.34-.22-2.8 1 .99-2.73-.24-.37c-1.03-1.61-1.57-3.48-1.57-5.45 0-4.48 3.65-8.13 8.13-8.13 4.48 0 8.13 3.65 8.13 8.13 0 4.49-3.65 8.18-8.13 8.18zm4.45-6.09c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28z"/>
                </svg>
                <span class="direct-btn-text">Написать в WhatsApp</span>
                <span class="direct-btn-arrow">→</span>
              </a>

              <a href="${contacts.phoneHref || ('tel:' + contacts.phone.replace(/[^0-9+]/g, ''))}" class="direct-action-btn direct-btn-phone">
                <svg class="direct-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span class="direct-btn-text">Позвонить: ${escapeHtml(contacts.phone)}</span>
                <span class="direct-btn-arrow">→</span>
              </a>
            </div>
          </div>
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
 * 2. Канонический генератор главной страницы index.html
 */
function generateIndexHTML(siteContent) {
  const home = siteContent.home;
  const contacts = home.contacts;
  const projectsMap = {};
  siteContent.projects.forEach(p => { projectsMap[p.filename] = p; });

  const homeOrder = siteContent.homeProjectsOrder;

  // 1. Первые 4 проекта в основной сетке
  let mainGridCards = '';
  for (let i = 0; i < 4 && i < homeOrder.length; i++) {
    const p = projectsMap[homeOrder[i]];
    if (!p) continue;
    mainGridCards += `
      <!-- ${i + 1}. ${p.title} -->
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

  // 2. Срезанный ряд: 5-й и 6-й проекты
  let peekCards = '';
  for (let i = 4; i < 6 && i < homeOrder.length; i++) {
    const p = projectsMap[homeOrder[i]];
    if (!p) continue;
    peekCards += `
        <!-- ${i + 1}. ${p.title} -->
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

  // 3. Услуги
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

  // 4. Статистика
  let statsHtml = '';
  (home.aboutSection.stats || []).forEach(st => {
    statsHtml += `
            <div class="stat-item">
              <span class="stat-number" data-target="${st.target}" data-suffix="${st.suffix}"${st.format ? ` data-format="${st.format}"` : ''}>${st.target}${st.suffix}</span>
              <span class="stat-label">${escapeHtml(st.label)}</span>
            </div>\n`;
  });

  // 5. Массив для Яндекс.Карты
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

  const heroSlides = home.hero.slides && home.hero.slides.length >= 2
    ? home.hero.slides
    : ['images/COVER_MAIN/cover_main_makarovski.webp', 'images/COVER_MAIN/cover_main_nekrasova.webp'];

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FERRO DESIGN™ — Студия интерьерного дизайна в Екатеринбурге</title>
  <meta name="description" content="Студия авторского интерьерного дизайна FERRO DESIGN под руководством Артема Марченко в Екатеринбурге. Разработка жилых и коммерческих пространств под ключ.">
  <meta property="og:title" content="FERRO DESIGN™ — Студия интерьерного дизайна">
  <meta property="og:description" content="Разработка авторских интерьеров жилых и коммерческих пространств в Екатеринбурге и по всей России.">
  <meta property="og:image" content="https://ferro-design.ru/images/COVER_MAIN/cover_main_makarovski.webp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://ferro-design.ru/images/COVER_MAIN/cover_main_makarovski.webp">
  <meta property="og:type" content="website">
  <link rel="stylesheet" href="style.css?v=2">
  <link rel="icon" id="dynamicFavicon" type="image/png" href="favicon.png">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "additionalType": "https://schema.org/ProfessionalService",
    "name": "FERRO DESIGN™",
    "alternateName": "Студия авторского интерьерного дизайна FERRO DESIGN",
    "url": "https://ferro-design.ru/",
    "logo": "https://ferro-design.ru/images/logo.png",
    "image": "https://ferro-design.ru/images/COVER_MAIN/cover_main_makarovski.webp",
    "founder": {
      "@type": "Person",
      "name": "Артем Марченко"
    },
    "legalName": "ИП Соколова Надежда Валентиновна",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "ул. Розы Люксембург, 17",
      "addressLocality": "Екатеринбург",
      "addressRegion": "Свердловская область",
      "addressCountry": "RU"
    },
    "telephone": "${contacts.phone}",
    "email": "${contacts.email}",
    "priceRange": "$$",
    "sameAs": [
      "https://t.me/ferrodesign_ekb",
      "https://www.youtube.com/@ferrodesign7446/featured",
      "https://ru.pinterest.com/ferro_design_ekb/"
    ]
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
        <a href="projects.html" class="nav-link">Проекты</a>
        <a href="#services" class="nav-link">Услуги</a>
        <a href="about.html" class="nav-link">О нас</a>
        <a href="#contact" class="nav-link">Контакты</a>
      </nav>
    </div>
  </header>

  <!-- HERO: ПЕРВЫЙ ЭКРАН (ЦЕЛЬНОЕ ФОТО 100vh + СТЕКЛЯННАЯ ПОДЛОЖКА) -->
  <section class="hero-section hero-fullscreen-photo">
    <div class="hero-bg-media">
      <img src="${heroSlides[0]}" alt="Интерьер ЖК «Макаровский»" class="hero-bg-slide active" fetchpriority="high">
      <img src="${heroSlides[1]}" alt="Интерьер ЖК «На Некрасова»" class="hero-bg-slide" loading="lazy" decoding="async">
    </div>

    <div class="hero-glass-card">
      <div class="hero-content">
        <div class="hero-title-container">
          <h1 class="hero-main-title">
            <span class="hero-title-line">
              <span class="hero-title-sizer" aria-hidden="true">ФЕРРО ДИЗАЙН</span>
              <span class="hero-title-word">${escapeHtml(home.hero.title || 'FERRO DESIGN')}</span>
            </span>
          </h1>
          <div class="hero-signature-wrap">
            <img src="images/podpis.png" alt="FERRO Signature" class="hero-signature-img">
          </div>
        </div>

        <div class="hero-right-col">
          <p class="hero-description">
            ${escapeHtml(home.hero.description || '')}
          </p>
          <div class="btn-wrapper">
            <a href="#contact" class="btn-outline-minimal">${escapeHtml(home.hero.btnText || home.hero.buttonText || 'Обсудить проект')}</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- СЕКЦИЯ: НАШИ ПРОЕКТЫ -->
  <section class="featured-projects" id="projects">
    <div class="section-header">
      <h2 class="section-title">Наши проекты</h2>
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

  <!-- СЕКЦИЯ: УСЛУГИ -->
  <section id="services" class="services-section">
    <div class="services-container">
      <div class="section-title-wrap">
        <h2 class="services-section-title">Услуги</h2>
      </div>

      <div class="services-grid">
${servicesCards}      </div>
    </div>
  </section>

  <!-- СЕКЦИЯ: О НАС -->
  <section id="about" class="about-section">
    <div class="about-container">
      <div class="about-grid">
        <div class="about-col-left">
          <div class="about-text-group">
            <h2 class="about-section-title">О нас</h2>
            <p class="about-manifesto">
              ${escapeHtml(home.aboutSection.manifesto)}
            </p>
          </div>
          <div class="about-cta-group">
            <a href="about.html" class="btn-about-detail">
              <span class="btn-about-detail-text">Подробнее о студии</span>
              <span class="btn-about-detail-arrow" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </a>
          </div>
        </div>

        <div class="about-col-right">
          <div class="about-stats-grid">
${statsHtml}          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- СЕКЦИЯ: ГЕОГРАФИЯ ПРОЕКТОВ (ПОДВИЖНАЯ КАРТА) -->
  <section class="geo-section">
    <div class="geo-container">
      <div class="section-title-wrap">
        <h2 class="geo-title">География проектов</h2>
      </div>

      <div class="map-container">
        <div id="interactiveMap"></div>
        <div class="map-legend-pill">Перетаскивайте карту и нажимайте на точки для перехода к проектам</div>

        <div id="mapPopupCard" class="map-popup-card">
          <button type="button" class="map-popup-close" id="mapPopupClose" aria-label="Закрыть карточку">&times;</button>
          <div class="map-popup-img-wrap">
            <img id="mapCardImg" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" alt="Превью проекта">
          </div>
          <div class="map-popup-body">
            <div class="map-popup-city" id="mapCardCity">Город</div>
            <div class="map-popup-title" id="mapCardTitle">Название проекта</div>
            <div class="map-popup-meta">
              <span id="mapCardType">Тип</span> · <span id="mapCardArea">Площадь</span>
            </div>
            <div class="map-popup-link-hint">Открыть проект →</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- СЕКЦИЯ: КОНТАКТЫ -->
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

        <div class="contact-col-direct">
          <div class="contact-direct-card">
            <h3 class="contact-direct-title">Быстрая связь</h3>
            <p class="contact-direct-desc">
              Напишите напрямую основателю студии в мессенджере или позвоните — ответим на все вопросы и сориентируем по срокам и стоимости.
            </p>

            <div class="contact-direct-schedule">
              <span class="direct-schedule-dot" aria-hidden="true"></span>
              <span class="direct-schedule-text">Пн — Вс: 10:00 — 20:00 • Екатеринбург и удаленно по всей России</span>
            </div>

            <div class="contact-direct-actions">
              <a href="https://t.me/ferrodesign_ekb" target="_blank" rel="noopener" class="direct-action-btn direct-btn-telegram">
                <svg class="direct-btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.62 3.72-.53.37-1.01.55-1.44.54-.48-.01-1.4-.27-2.08-.49-.84-.27-1.5-.42-1.44-.88.03-.24.38-.49 1.03-.75 4.04-1.76 6.74-2.92 8.09-3.5 3.86-1.61 4.66-1.89 5.19-1.9.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.19-.04.35z"/>
                </svg>
                <span class="direct-btn-text">Написать в Telegram</span>
                <span class="direct-btn-arrow">→</span>
              </a>

              <a href="https://wa.me/${contacts.phone ? contacts.phone.replace(/[^0-9]/g, '') : '79634426192'}" target="_blank" rel="noopener" class="direct-action-btn direct-btn-whatsapp">
                <svg class="direct-btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.96.57 3.88 1.66 5.53L2 22l4.73-1.68c1.58.97 3.4 1.59 5.31 1.59 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm0 18.09c-1.67 0-3.29-.49-4.68-1.41l-.34-.22-2.8 1 .99-2.73-.24-.37c-1.03-1.61-1.57-3.48-1.57-5.45 0-4.48 3.65-8.13 8.13-8.13 4.48 0 8.13 3.65 8.13 8.13 0 4.49-3.65 8.18-8.13 8.18zm4.45-6.09c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28z"/>
                </svg>
                <span class="direct-btn-text">Написать в WhatsApp</span>
                <span class="direct-btn-arrow">→</span>
              </a>

              <a href="${contacts.phoneHref || ('tel:' + contacts.phone.replace(/[^0-9+]/g, ''))}" class="direct-action-btn direct-btn-phone">
                <svg class="direct-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span class="direct-btn-text">Позвонить: ${escapeHtml(contacts.phone)}</span>
                <span class="direct-btn-arrow">→</span>
              </a>
            </div>
          </div>
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
        <li><a href="#services">УСЛУГИ</a></li>
        <li><a href="about.html">О НАС</a></li>
        <li><a href="privacy.html">ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ</a></li>
        <li><a href="#contact">КОНТАКТЫ</a></li>
      </ul>
      <div class="footer-credits">НЕ ЯВЛЯЕТСЯ ПУБЛИЧНОЙ ОФЕРТОЙ</div>
    </div>
  </footer>

  <script>
    (function setupLazyYandexMap() {
      const mapContainer = document.getElementById('interactiveMap');
      if (!mapContainer) return;

      let isLoaded = false;
      function loadYandexMapScript() {
        if (isLoaded) return;
        isLoaded = true;

        const script = document.createElement('script');
        script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
        script.async = true;
        script.onload = () => {
          if (window.ymaps) {
            window.ymaps.ready(initMap);
          }
        };
        document.head.appendChild(script);
      }

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              obs.disconnect();
              loadYandexMapScript();
            }
          });
        }, {
          rootMargin: '450px 0px',
          threshold: 0.01
        });
        observer.observe(mapContainer);
      } else {
        loadYandexMapScript();
      }
    })();

    function initMap() {
      const map = new ymaps.Map('interactiveMap', {
        center: [56.8330, 60.6050],
        zoom: 11,
        controls: ['zoomControl', 'fullscreenControl']
      });

      map.behaviors.disable('scrollZoom');

      const mapEl = document.getElementById('interactiveMap');
      if (mapEl) {
        mapEl.addEventListener('wheel', (e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomDelta = e.deltaY < 0 ? 1 : -1;
            map.setZoom(map.getZoom() + zoomDelta, { duration: 200 });
          }
        }, { passive: false });
      }

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
 * 3. Канонический генератор каталога projects.html
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
        <!-- ${escapeHtml(p.title)} -->
        <a href="${escapeHtml(p.filename)}" class="project-card hw-card" data-category="${escapeHtml(p.filterCategory || 'flats')}" data-area="${p.area}">
          <div class="card-media-wrap">
            <img src="${escapeHtml(p.cardImage || p.heroDay)}" alt="${escapeHtml(p.title)}" loading="lazy" decoding="async">
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
  <title>Все проекты — FERRO DESIGN™</title>
  <meta name="description" content="Портфолио реализованных дизайн-проектов интерьеров студии FERRO DESIGN™: жилые квартиры, загородные резиденции, коммерческие объекты.">
  <meta property="og:title" content="Портфолио проектов — FERRO DESIGN™">
  <meta property="og:description" content="Жилые квартиры, загородные резиденции и коммерческие пространства студии дизайна FERRO DESIGN.">
  <meta property="og:image" content="https://ferro-design.ru/images/COVER_MAIN/cover_main_makarovski.webp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://ferro-design.ru/images/COVER_MAIN/cover_main_makarovski.webp">
  <meta property="og:type" content="website">
  <link rel="stylesheet" href="style.css?v=2">
  <link rel="icon" id="dynamicFavicon" type="image/png" href="favicon.png">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Проекты FERRO DESIGN™",
    "description": "Портфолио реализованных дизайн-проектов интерьеров студии FERRO DESIGN™: жилые квартиры, загородные дома, коммерческие объекты.",
    "publisher": {
      "@type": "HomeAndConstructionBusiness",
      "name": "FERRO DESIGN™",
      "telephone": "${escapeHtml(contacts.phone || '+7 (963) 442-61-92')}",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "${escapeHtml(contacts.location || 'ул. Розы Люксембург, 17')}",
        "addressLocality": "Екатеринбург",
        "addressCountry": "RU"
      }
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
        <a href="projects.html" class="nav-link active">Проекты</a>
        <a href="index.html#services" class="nav-link">Услуги</a>
        <a href="about.html" class="nav-link">О нас</a>
        <a href="#contact" class="nav-link">Контакты</a>
      </nav>
    </div>
  </header>

  <!-- СЕКЦИЯ: ВСЕ ПРОЕКТЫ -->
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

  <!-- СЕКЦИЯ: КОНТАКТЫ -->
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

        <div class="contact-col-direct">
          <div class="contact-direct-card">
            <h3 class="contact-direct-title">Быстрая связь</h3>
            <p class="contact-direct-desc">
              Напишите напрямую основателю студии в мессенджере или позвоните — ответим на все вопросы и сориентируем по срокам и стоимости.
            </p>

            <div class="contact-direct-schedule">
              <span class="direct-schedule-dot" aria-hidden="true"></span>
              <span class="direct-schedule-text">Пн — Вс: 10:00 — 20:00 • Екатеринбург и удаленно по всей России</span>
            </div>

            <div class="contact-direct-actions">
              <a href="https://t.me/ferrodesign_ekb" target="_blank" rel="noopener" class="direct-action-btn direct-btn-telegram">
                <svg class="direct-btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.62 3.72-.53.37-1.01.55-1.44.54-.48-.01-1.4-.27-2.08-.49-.84-.27-1.5-.42-1.44-.88.03-.24.38-.49 1.03-.75 4.04-1.76 6.74-2.92 8.09-3.5 3.86-1.61 4.66-1.89 5.19-1.9.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.19-.04.35z"/>
                </svg>
                <span class="direct-btn-text">Написать в Telegram</span>
                <span class="direct-btn-arrow">→</span>
              </a>

              <a href="https://wa.me/${contacts.phone ? contacts.phone.replace(/[^0-9]/g, '') : '79634426192'}" target="_blank" rel="noopener" class="direct-action-btn direct-btn-whatsapp">
                <svg class="direct-btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.96.57 3.88 1.66 5.53L2 22l4.73-1.68c1.58.97 3.4 1.59 5.31 1.59 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm0 18.09c-1.67 0-3.29-.49-4.68-1.41l-.34-.22-2.8 1 .99-2.73-.24-.37c-1.03-1.61-1.57-3.48-1.57-5.45 0-4.48 3.65-8.13 8.13-8.13 4.48 0 8.13 3.65 8.13 8.13 0 4.49-3.65 8.18-8.13 8.18zm4.45-6.09c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28z"/>
                </svg>
                <span class="direct-btn-text">Написать в WhatsApp</span>
                <span class="direct-btn-arrow">→</span>
              </a>

              <a href="${contacts.phoneHref || ('tel:' + contacts.phone.replace(/[^0-9+]/g, ''))}" class="direct-action-btn direct-btn-phone">
                <svg class="direct-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span class="direct-btn-text">Позвонить: ${escapeHtml(contacts.phone)}</span>
                <span class="direct-btn-arrow">→</span>
              </a>
            </div>
          </div>
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
        <li><a href="#contact">КОНТАКТЫ</a></li>
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
 * 4. Канонический генератор страницы about.html
 */
function generateAboutHTML(siteContent) {
  const about = siteContent.aboutPage;
  const contacts = siteContent.home.contacts;

  let stepsHtml = '';
  (about.steps || []).forEach(step => {
    stepsHtml += `
          <!-- Карточка ${step.num} -->
          <div class="design-step-card">
            <span class="step-num">${step.num}</span>
            <h3 class="step-title">${escapeHtml(step.title)}</h3>
            <p class="step-text">
              ${escapeHtml(step.text)}
            </p>
          </div>\n`;
  });

  let faqItemsHtml = '';
  let faqSchemaQuestions = [];
  (about.faq || []).forEach(f => {
    faqItemsHtml += `
          <details class="faq-item">
            <summary class="faq-question">${escapeHtml(f.question)}</summary>
            <p class="faq-answer">
              ${escapeHtml(f.answer)}
            </p>
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
    "@graph": [
      {
        "@type": "AboutPage",
        "name": "О студии FERRO DESIGN™",
        "description": "Информация о студии интерьерного дизайна FERRO DESIGN: этапы проектирования, авторский надзор, география и ответы на частые вопросы.",
        "url": "https://ferro-design.ru/about.html",
        "mainEntity": {
          "@type": "HomeAndConstructionBusiness",
          "name": "FERRO DESIGN™",
          "founder": {
            "@type": "Person",
            "name": "Артем Марченко"
          },
          "telephone": contacts.phone || "+7 (963) 442-61-92",
          "email": contacts.email || "artem1-nt@mail.ru"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqSchemaQuestions
      }
    ]
  }, null, 2);

  const badgeText = about.badge || about.chiefBadge || 'ГЛАВНЫЙ ДИЗАЙНЕР: АРТЕМ МАРЧЕНКО';
  const cleanBadgeText = badgeText.replace(/^ГЛАВНЫЙ ДИЗАЙНЕР:\s*/i, '');

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

  <!-- ФИКСИРОВАННАЯ ШАПКА -->
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

  <main>
    <!-- ПЕРВЫЙ ЭКРАН -->
    <section class="about-page-hero">
      <h1 class="about-page-title">${escapeHtml(about.title)}</h1>
      <p class="about-page-lead">
        ${escapeHtml(about.lead)}
      </p>

      <div class="about-chief-badge">
        <span>ГЛАВНЫЙ ДИЗАЙНЕР:</span> ${escapeHtml(cleanBadgeText.toUpperCase())}
      </div>
    </section>

    <!-- ОСНОВНОЙ КОНТЕНТ -->
    <section class="about-content-section">
      <!-- 1. ЧТО ВХОДИТ В ДИЗАЙН-ПРОЕКТ ПОД КЛЮЧ -->
      <div class="about-content-block">
        <h2 class="about-block-title">Что входит в полный дизайн-проект</h2>
        
        <div class="design-steps-grid">
${stepsHtml}        </div>
      </div>

      <!-- 2. АВТОРСКИЙ НАДЗОР И РЕАЛИЗАЦИЯ -->
      <div class="about-content-block">
        <h2 class="about-block-title">Авторский надзор и комплектация</h2>
        
        <div class="geo-info-card">
          ${about.supervisionHtml}
        </div>
      </div>

      <!-- 3. ГЕОГРАФИЯ РАБОТЫ -->
      <div class="about-content-block">
        <h2 class="about-block-title">География проектов</h2>
        
        <div class="geo-info-card">
          ${about.geoHtml}
        </div>
      </div>

      <!-- 4. FAQ: ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ -->
      <div class="about-content-block">
        <h2 class="about-block-title">Часто задаваемые вопросы (FAQ)</h2>
        
        <div class="faq-list">
${faqItemsHtml}        </div>
      </div>
    </section>

    <!-- СЕКЦИЯ КОНТАКТОВ -->
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

          <div class="contact-col-direct">
          <div class="contact-direct-card">
            <h3 class="contact-direct-title">Быстрая связь</h3>
            <p class="contact-direct-desc">
              Напишите напрямую основателю студии в мессенджере или позвоните — ответим на все вопросы и сориентируем по срокам и стоимости.
            </p>

            <div class="contact-direct-schedule">
              <span class="direct-schedule-dot" aria-hidden="true"></span>
              <span class="direct-schedule-text">Пн — Вс: 10:00 — 20:00 • Екатеринбург и удаленно по всей России</span>
            </div>

            <div class="contact-direct-actions">
              <a href="https://t.me/ferrodesign_ekb" target="_blank" rel="noopener" class="direct-action-btn direct-btn-telegram">
                <svg class="direct-btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.62 3.72-.53.37-1.01.55-1.44.54-.48-.01-1.4-.27-2.08-.49-.84-.27-1.5-.42-1.44-.88.03-.24.38-.49 1.03-.75 4.04-1.76 6.74-2.92 8.09-3.5 3.86-1.61 4.66-1.89 5.19-1.9.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.19-.04.35z"/>
                </svg>
                <span class="direct-btn-text">Написать в Telegram</span>
                <span class="direct-btn-arrow">→</span>
              </a>

              <a href="https://wa.me/${contacts.phone ? contacts.phone.replace(/[^0-9]/g, '') : '79634426192'}" target="_blank" rel="noopener" class="direct-action-btn direct-btn-whatsapp">
                <svg class="direct-btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.96.57 3.88 1.66 5.53L2 22l4.73-1.68c1.58.97 3.4 1.59 5.31 1.59 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm0 18.09c-1.67 0-3.29-.49-4.68-1.41l-.34-.22-2.8 1 .99-2.73-.24-.37c-1.03-1.61-1.57-3.48-1.57-5.45 0-4.48 3.65-8.13 8.13-8.13 4.48 0 8.13 3.65 8.13 8.13 0 4.49-3.65 8.18-8.13 8.18zm4.45-6.09c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28z"/>
                </svg>
                <span class="direct-btn-text">Написать в WhatsApp</span>
                <span class="direct-btn-arrow">→</span>
              </a>

              <a href="${contacts.phoneHref || ('tel:' + contacts.phone.replace(/[^0-9+]/g, ''))}" class="direct-action-btn direct-btn-phone">
                <svg class="direct-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span class="direct-btn-text">Позвонить: ${escapeHtml(contacts.phone)}</span>
                <span class="direct-btn-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  </main>

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
        <li><a href="#contact">КОНТАКТЫ</a></li>
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
    const projIdx = data.allProjectsOrder.indexOf(targetFilename);
    const curProj = data.projects.find(p => p.filename === targetFilename) || data.projects[0];
    const nextIdx = (projIdx + 1) % data.allProjectsOrder.length;
    const nextFilename = data.allProjectsOrder[nextIdx];
    const nextProj = data.projects.find(p => p.filename === nextFilename) || data.projects[0];
    html = generateProjectPageHTML(curProj, nextProj, data.home.contacts);
  }

  window.AdminState.newFilesMap.forEach((val, virtualPath) => {
    const rx = new RegExp(escapeRegex(virtualPath), 'g');
    html = html.replace(rx, val.dataUrl);
  });

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

    if (html.includes('<style>') || html.includes('<style ')) {
      errors.push(`${curFn}: найден запрещенный тег <style>`);
    }

    if (!html.includes('class="glass-header"') || !html.includes('На главную') || !html.includes('Все проекты')) {
      errors.push(`${curFn}: повреждена шапка glass-header`);
    }
    const headerMatch = html.match(/<header class="glass-header">([\s\S]*?)<\/header>/);
    if (headerMatch && (headerMatch[1].toLowerCase().includes('svg') || headerMatch[1].includes('→'))) {
      errors.push(`${curFn}: в glass-header обнаружены запрещенные стрелки/svg`);
    }

    if (!html.includes('project-yodezeen-specs')) {
      errors.push(`${curFn}: отсутствует блок характеристик project-yodezeen-specs`);
    }

    const roomIds = Array.from(html.matchAll(/<div class="room-header"\s+id="([^"]+)">/g)).map(m => m[1]);
    const navHrefs = Array.from(html.matchAll(/<a href="#([^"]+)"\s+class="hw-room-link[^"]*">/g)).map(m => m[1]);
    if (roomIds.length === 0) {
      errors.push(`${curFn}: нет помещений room-header`);
    } else if (JSON.stringify(roomIds) !== JSON.stringify(navHrefs)) {
      errors.push(`${curFn}: ID помещений [${roomIds}] не совпадают с меню [${navHrefs}]`);
    }

    const nextMatch = html.match(/<div class="next-case-bar">[\s\S]*?<a href="([^"]+)"[\s\S]*?<span>(.*?)<\/span>/);
    if (!nextMatch || nextMatch[1].trim() !== nextFn) {
      errors.push(`${curFn}: неверная ссылка на следующий проект в next-case-bar`);
    }

    ['id="contact"', 'contact-section', 'contact-direct-card', 'direct-btn-telegram', 'direct-btn-whatsapp', 'direct-btn-phone'].forEach(elem => {
      if (!html.includes(elem)) errors.push(`${curFn}: отсутствует обязательный элемент прямой связи ${elem}`);
    });
    ['<form', 'name="website"', 'name="name"', 'btn-submit'].forEach(forbidden => {
      if (html.includes(forbidden)) errors.push(`${curFn}: обнаружен запрещенный элемент формы ${forbidden} (152-ФЗ)`);
    });

    ['site-footer', 'footer-socials', 'footer-brand-banner', 'footer-bottom-bar', 'FERRO DESIGN™'].forEach(elem => {
      if (!html.includes(elem)) errors.push(`${curFn}: отсутствует обязательный элемент подвала ${elem}`);
    });

    if (!html.includes('style.css?v=2') || !html.includes('script.js?v=2')) {
      errors.push(`${curFn}: отсутствует style.css?v=2 или script.js?v=2`);
    }

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

async function getGithubErrorDetails(res) {
  try {
    const d = await res.json();
    if (d.message) {
      return d.errors ? `${d.message} (${JSON.stringify(d.errors)})` : d.message;
    }
    return JSON.stringify(d);
  } catch (_) {
    return res.statusText || 'Неизвестная ошибка';
  }
}

async function uploadBlobToGithub(repo, token, content, isBase64 = false) {
  let bodyPayload;
  if (isBase64) {
    bodyPayload = { content, encoding: 'base64' };
  } else {
    const utf8Bytes = new TextEncoder().encode(content);
    let binary = '';
    const chunk = 8192;
    for (let i = 0; i < utf8Bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, utf8Bytes.subarray(i, i + chunk));
    }
    bodyPayload = { content: btoa(binary), encoding: 'base64' };
  }

  const res = await fetch(`https://api.github.com/repos/${repo}/git/blobs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyPayload)
  });

  if (!res.ok) {
    const detail = await getGithubErrorDetails(res);
    throw new Error(`Ошибка создания блоба (${res.status}): ${detail}`);
  }

  const data = await res.json();
  return data.sha;
}

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

  if (progressBox) progressBox.style.display = 'block';
  if (progressStep) progressStep.textContent = '1/5. Проверка целостности по 10 стандартам...';

  const errors = runClientSideValidation(data);
  if (errors.length > 0) {
    alert(`Обнаружены ошибки валидации (${errors.length}):\n\n` + errors.slice(0, 5).join('\n'));
    if (progressBox) progressBox.style.display = 'none';
    return;
  }

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

    if (progressStep) progressStep.textContent = '2/5. Подключение к репозиторию GitHub...';
    const refRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!refRes.ok) {
      const errDetail = await getGithubErrorDetails(refRes);
      if (refRes.status === 401) {
        throw new Error(`Ошибка 401 (Unauthorized): Неверный GitHub токен. Проверьте токен в настройках API (шестерёнка в шапке). ${errDetail}`);
      } else if (refRes.status === 404) {
        throw new Error(`Ошибка 404 (Not Found): Репозиторий "${repo}" или ветка "${branch}" не найдены, либо у токена нет прав. Убедитесь, что токен создан с галочкой "repo". ${errDetail}`);
      } else if (refRes.status === 403) {
        throw new Error(`Ошибка 403 (Forbidden): Превышен лимит запросов GitHub API или доступ заблокирован. ${errDetail}`);
      } else {
        throw new Error(`Не удалось подключиться к GitHub (${refRes.status}): ${errDetail}`);
      }
    }
    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    const commitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits/${latestCommitSha}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!commitRes.ok) {
      const errDetail = await getGithubErrorDetails(commitRes);
      throw new Error(`Ошибка получения последнего коммита (${commitRes.status}): ${errDetail}`);
    }
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    if (progressStep) progressStep.textContent = `3/5. Загрузка новых изображений WebP (${window.AdminState.newFilesMap.size} шт.)...`;
    const treeItems = [];

    for (const [vPath, fData] of window.AdminState.newFilesMap.entries()) {
      const blobSha = await uploadBlobToGithub(repo, token, fData.base64, true);
      treeItems.push({
        path: vPath,
        mode: '100644',
        type: 'blob',
        sha: blobSha
      });
    }

    if (progressStep) progressStep.textContent = '4/5. Генерация HTML-страниц и каталога...';

    async function addTreeFile(filePath, fileContent) {
      const utf8Len = new TextEncoder().encode(fileContent).length;
      // Для data/site-content.json и любых файлов > 50 KB производим предварительную загрузку через POST /git/blobs
      if (filePath === 'data/site-content.json' || utf8Len > 50 * 1024) {
        const blobSha = await uploadBlobToGithub(repo, token, fileContent, false);
        treeItems.push({
          path: filePath,
          mode: '100644',
          type: 'blob',
          sha: blobSha
        });
      } else {
        treeItems.push({
          path: filePath,
          mode: '100644',
          type: 'blob',
          content: fileContent
        });
      }
    }

    await addTreeFile('data/site-content.json', JSON.stringify(data, null, 2));
    await addTreeFile('index.html', generateIndexHTML(data));
    await addTreeFile('projects.html', generateProjectsCatalogHTML(data));
    await addTreeFile('about.html', generateAboutHTML(data));
    await addTreeFile('sitemap.xml', generateSitemapXML(data));

    const projectsMap = {};
    data.projects.forEach(p => { projectsMap[p.filename] = p; });
    const order = data.allProjectsOrder;

    for (let i = 0; i < order.length; i++) {
      const curProj = projectsMap[order[i]];
      const nextProj = projectsMap[order[(i + 1) % order.length]];
      if (curProj && nextProj) {
        await addTreeFile(curProj.filename, generateProjectPageHTML(curProj, nextProj, data.home.contacts));
      }
    }

    if (progressStep) progressStep.textContent = '5/5. Атомарный коммит и обновление ветки main...';
    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems })
    });
    if (!treeRes.ok) {
      const errDetail = await getGithubErrorDetails(treeRes);
      throw new Error(`Ошибка создания Git Tree (${treeRes.status}): ${errDetail}`);
    }
    const newTreeData = await treeRes.json();

    const newCommitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'admin: автоматическое обновление контента и кейсов студии FERRO DESIGN™',
        tree: newTreeData.sha,
        parents: [latestCommitSha]
      })
    });
    if (!newCommitRes.ok) {
      const errDetail = await getGithubErrorDetails(newCommitRes);
      throw new Error(`Ошибка создания коммита (${newCommitRes.status}): ${errDetail}`);
    }
    const newCommitData = await newCommitRes.json();

    const updateRefRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ sha: newCommitData.sha, force: false })
    });
    if (!updateRefRes.ok) {
      const errDetail = await getGithubErrorDetails(updateRefRes);
      throw new Error(`Ошибка обновления ветки ${branch} (${updateRefRes.status}): ${errDetail}`);
    }

    window.AdminState.newFilesMap.clear();

    window.AdminState.publishLockUntil = Date.now() + 60 * 1000;
    window.AdminState.hasUnsavedChanges = false;
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

async function exportAllFilesZip() {
  syncFormDataToState();
  const data = window.AdminState.data;
  showToast('Формирование архива сайта...', 'info');

  const files = [];

  files.push({ name: 'data/site-content.json', content: JSON.stringify(data, null, 2) });
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

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true); // UTF-8 filename flag
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, size, true);
    view.setUint32(22, size, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    parts.push(localHeader);
    parts.push(fileBytes);

    const cdHeader = new Uint8Array(46 + nameBytes.length);
    const cdView = new DataView(cdHeader.buffer);
    cdView.setUint32(0, 0x02014b50, true);
    cdView.setUint16(4, 20, true);
    cdView.setUint16(6, 20, true);
    cdView.setUint16(8, 0x0800, true); // UTF-8 filename flag
    cdView.setUint16(10, 0, true);
    cdView.setUint16(12, 0, true);
    cdView.setUint16(14, 0, true);
    cdView.setUint32(16, crc, true);
    cdView.setUint32(20, size, true);
    cdView.setUint32(24, size, true);
    cdView.setUint16(28, nameBytes.length, true);
    cdView.setUint16(30, 0, true);
    cdView.setUint16(32, 0, true);
    cdView.setUint16(34, 0, true);
    cdView.setUint16(36, 0, true);
    cdView.setUint32(38, 0, true);
    cdView.setUint32(42, offset, true);
    cdHeader.set(nameBytes, 46);

    centralDir.push(cdHeader);
    offset += localHeader.length + fileBytes.length;
  }

  const cdOffset = offset;
  let cdSize = 0;
  centralDir.forEach(cd => { cdSize += cd.length; });

  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, files.length, true);
  eocdView.setUint16(10, files.length, true);
  eocdView.setUint32(12, cdSize, true);
  eocdView.setUint32(16, cdOffset, true);
  eocdView.setUint16(20, 0, true);

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
    let data = null;
    try {
      const res = await fetch('../data/site-content.json');
      if (res.ok) {
        data = await res.json();
      }
    } catch (localErr) {
      console.warn('Локальный fetch заблокирован браузером (file://). Пробуем загрузку из GitHub...', localErr);
    }

    if (!data) {
      const repo = window.AdminState.githubRepo || 'RefundE/FERRO_DESIGN_WEB';
      const branch = window.AdminState.githubBranch || 'main';
      const ghUrl = `https://raw.githubusercontent.com/${repo}/${branch}/data/site-content.json?t=${Date.now()}`;
      try {
        const ghRes = await fetch(ghUrl);
        if (ghRes.ok) {
          data = await ghRes.json();
          showToast('Данные успешно загружены из репозитория GitHub', 'info');
        }
      } catch (ghErr) {
        console.warn('GitHub raw fallback fetch error:', ghErr);
      }
    }

    if (!data) {
      throw new Error('Не удалось загрузить data/site-content.json. Откройте админку через локальный сервер (Live Server) или по адресу https://ferro-design.ru/admin/');
    }

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

  if (data.home && data.home.hero) {
    const hTitle = document.getElementById('homeHeroTitle');
    const hDesc = document.getElementById('homeHeroDescription');
    const hBtn = document.getElementById('homeHeroButton');
    if (hTitle) data.home.hero.title = hTitle.value.trim();
    if (hDesc) data.home.hero.description = hDesc.value.trim();
    if (hBtn) {
      data.home.hero.btnText = hBtn.value.trim();
      data.home.hero.buttonText = hBtn.value.trim();
    }
  }

  const srvNames = document.querySelectorAll('.srv-name');
  const srvDescs = document.querySelectorAll('.srv-desc');
  const srvPrices = document.querySelectorAll('.srv-price');
  (data.home.services || []).forEach((srv, i) => {
    if (srvNames[i]) srv.name = srvNames[i].value.trim();
    if (srvDescs[i]) srv.desc = srvDescs[i].value.trim();
    if (srvPrices[i]) srv.price = srvPrices[i].value.trim();
  });

  const manInput = document.getElementById('homeAboutManifesto');
  if (manInput) data.home.aboutSection.manifesto = manInput.value.trim();

  const statTargets = document.querySelectorAll('.stat-target');
  const statSuffixes = document.querySelectorAll('.stat-suffix');
  const statLabels = document.querySelectorAll('.stat-label');
  (data.home.aboutSection.stats || []).forEach((st, i) => {
    if (statTargets[i]) st.target = parseInt(statTargets[i].value, 10) || statTargets[i].value.trim();
    if (statSuffixes[i]) st.suffix = statSuffixes[i].value;
    if (statLabels[i]) st.label = statLabels[i].value.trim();
  });

  const abTitle = document.getElementById('aboutPageTitle');
  const abBadge = document.getElementById('aboutPageBadge');
  const abLead = document.getElementById('aboutPageLead');
  const abSuper = document.getElementById('aboutSupervision');
  const abGeo = document.getElementById('aboutGeo');
  if (abTitle) data.aboutPage.title = abTitle.value.trim();
  if (abBadge) {
    data.aboutPage.badge = abBadge.value.trim();
    data.aboutPage.chiefBadge = abBadge.value.trim();
  }
  if (abLead) data.aboutPage.lead = abLead.value.trim();
  if (abSuper) data.aboutPage.supervisionHtml = abSuper.value.trim();
  if (abGeo) data.aboutPage.geoHtml = abGeo.value.trim();

  const stepTitles = document.querySelectorAll('.step-title');
  const stepTexts = document.querySelectorAll('.step-text');
  (data.aboutPage.steps || []).forEach((stp, i) => {
    if (stepTitles[i]) stp.title = stepTitles[i].value.trim();
    if (stepTexts[i]) stp.text = stepTexts[i].value.trim();
  });

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

  const curProj = data.projects.find(p => p.id === window.AdminState.activeProjectId);
  if (curProj) {
    const pTitle = document.getElementById('projTitle');
    const pFn = document.getElementById('projFilename');
    const pFolder = document.getElementById('projFolder');
    const pCity = document.getElementById('projCity');
    const pArea = document.getElementById('projArea');
    const pMeta = document.getElementById('projMetaDesc');
    const pCoords = document.getElementById('projCoords');

    if (pTitle) {
      const val = pTitle.value.trim();
      if (val) {
        curProj.title = val;
        curProj.cardTitle = val;
      }
    }
    if (pFn) {
      let newFn = pFn.value.trim();
      if (newFn) {
        if (!newFn.toLowerCase().endsWith('.html')) {
          newFn += '.html';
          pFn.value = newFn;
        }
        const oldFn = curProj.filename;
        if (oldFn && oldFn !== newFn) {
          // Обновить в data.allProjectsOrder на той же позиции
          if (Array.isArray(data.allProjectsOrder)) {
            const idx = data.allProjectsOrder.indexOf(oldFn);
            if (idx !== -1) {
              data.allProjectsOrder[idx] = newFn;
            }
          }
          // Обновить в data.homeProjectsOrder (если проект был представлен на главной)
          if (Array.isArray(data.homeProjectsOrder)) {
            const hIdx = data.homeProjectsOrder.indexOf(oldFn);
            if (hIdx !== -1) {
              data.homeProjectsOrder[hIdx] = newFn;
            }
          }
          curProj.filename = newFn;
          const fnBadge = document.getElementById('activeProjectFilenameBadge');
          if (fnBadge) fnBadge.textContent = newFn;
        }
      }
    }
    if (pFolder) curProj.folder = pFolder.value.trim();
    if (pCity) {
      const cVal = pCity.value.trim();
      curProj.city = cVal;
      curProj.cardCity = cVal;
      curProj.mapCity = cVal;
    }
    if (pArea) {
      const parsedArea = parseInt(pArea.value, 10);
      if (!isNaN(parsedArea) && parsedArea > 0) {
        curProj.area = parsedArea;
      }
    }
    if (pMeta) curProj.metaDesc = pMeta.value.trim();
    if (pCoords && pCoords.value.includes(',')) {
      const parts = pCoords.value.split(',').map(s => parseFloat(s.trim()));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        curProj.coords = [parts[0], parts[1]];
      }
    }
  }
}

function renderTab1Texts(data) {
  const home = data.home || {};
  if (home.hero) {
    document.getElementById('homeHeroTitle').value = home.hero.title || '';
    document.getElementById('homeHeroButton').value = home.hero.btnText || home.hero.buttonText || '';
    document.getElementById('homeHeroDescription').value = home.hero.description || '';
  }

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
          <input type="text" class="admin-input stat-target" value="${st.target !== undefined ? st.target : ''}">
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

  const about = data.aboutPage || {};
  document.getElementById('aboutPageTitle').value = about.title || '';
  document.getElementById('aboutPageBadge').value = about.badge || about.chiefBadge || 'Артем Марченко / Главный дизайнер';
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
  const categoryLabel = proj.specsCategory || proj.badgeLabel || 'Квартира';

  card.innerHTML = `
    <div class="reorder-slot-num">${index + 1}</div>
    <img src="${thumb}" alt="${escapeHtml(proj.title)}" class="reorder-thumb" onerror="this.src='../images/logo.png'">
    <div class="reorder-info">
      <select class="slot-select-dropdown" title="Выберите проект для слота ${index + 1}">
        ${allProjects.map(p => `
          <option value="${p.filename}" ${p.filename === proj.filename ? 'selected' : ''}>
            ${escapeHtml(p.title)}${p.city ? ` (${escapeHtml(p.city)})` : ''}
          </option>
        `).join('')}
      </select>
      <div class="reorder-meta">
        <span class="reorder-badge">${escapeHtml(categoryLabel)}</span>
        <span>•</span>
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

    btn.onclick = () => {
      syncFormDataToState();
      selectProjectInBuilder(proj);
    };
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

  document.querySelectorAll('.geo-preset-chip').forEach(chip => {
    chip.onclick = () => {
      document.getElementById('projCoords').value = chip.dataset.coords;
      proj.coords = chip.dataset.coords.split(',').map(s => parseFloat(s.trim()));
      showToast(`Координаты обновлены: ${chip.textContent}`, 'info');
    };
  });

  const dayImg = document.getElementById('dayCoverImgPreview');
  const dayPath = document.getElementById('dayCoverPath');
  const dayName = document.getElementById('dayCoverName');
  if (proj.heroDay) {
    dayImg.src = `../${proj.heroDay}`;
    dayPath.textContent = proj.heroDay;
    dayName.textContent = proj.heroDay.split('/').pop();
  }

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

  const nameInput = card.querySelector('.room-input-name');
  const navInput = card.querySelector('.room-input-nav');
  const prefixInput = card.querySelector('.room-input-prefix');

  nameInput.oninput = () => {
    room.name = nameInput.value;
    card.querySelector('.room-block-heading').textContent = room.name || 'Помещение';

    const dict = window.AdminState.data?.roomPrefixDictionary;
    const upperKey = nameInput.value.toUpperCase().trim();
    if (dict && dict[upperKey]) {
      const match = dict[upperKey];
      if (match.nav) {
        room.nav = match.nav;
        navInput.value = match.nav;
      }
      if (match.prefix) {
        room.prefix = match.prefix;
        prefixInput.value = match.prefix;
      }
      if (match.id) {
        room.id = match.id;
      }
      const dropHint = card.querySelector('.dropzone-hint');
      if (dropHint) {
        dropHint.textContent = `Изображения автоматически конвертируются в WebP и нумеруются с префиксом «${room.prefix || 'render'}»`;
      }
    }
  };

  navInput.oninput = () => { room.nav = navInput.value; };
  prefixInput.oninput = () => { room.prefix = prefixInput.value; };

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
        const card = createRenderCard(src, cap, 'diptych', itemIdx, subIdx, room, proj, gridContainer);
        gridContainer.appendChild(card);
      });
    } else {
      const card = createRenderCard(item.src, item.cap, item.type || 'full', itemIdx, null, room, proj, gridContainer);
      gridContainer.appendChild(card);
    }
  });
}

function createRenderCard(src, cap, layoutType, itemIdx, subIdx, room, proj, gridContainer) {
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

  const capInput = card.querySelector('.render-item-caption-input');
  capInput.oninput = () => {
    if (subIdx !== null && room.items[itemIdx]?.items?.[subIdx]) {
      room.items[itemIdx].items[subIdx][1] = capInput.value;
    } else if (room.items[itemIdx]) {
      room.items[itemIdx].cap = capInput.value;
    }
  };

  const btnLeft = card.querySelector('.render-btn-left');
  if (btnLeft) {
    btnLeft.onclick = () => {
      if (itemIdx > 0) {
        const temp = room.items[itemIdx];
        room.items[itemIdx] = room.items[itemIdx - 1];
        room.items[itemIdx - 1] = temp;
        window.AdminState.hasUnsavedChanges = true;
        renderRoomItems(room, gridContainer, proj);
      }
    };
  }

  const btnRight = card.querySelector('.render-btn-right');
  if (btnRight) {
    btnRight.onclick = () => {
      if (itemIdx < room.items.length - 1) {
        const temp = room.items[itemIdx];
        room.items[itemIdx] = room.items[itemIdx + 1];
        room.items[itemIdx + 1] = temp;
        window.AdminState.hasUnsavedChanges = true;
        renderRoomItems(room, gridContainer, proj);
      }
    };
  }

  const layoutSel = card.querySelector('.render-layout-select');
  layoutSel.onchange = () => {
    const curItem = room.items[itemIdx];
    if (!curItem) return;
    const targetType = layoutSel.value;

    if (curItem.type === 'diptych' && targetType !== 'diptych') {
      // diptych -> full: разворачиваем кортеж в два отдельных объекта
      if (curItem.items && curItem.items.length === 2) {
        const [it1, it2] = curItem.items;
        room.items.splice(itemIdx, 1,
          { type: targetType, src: it1[0], cap: it1[1] },
          { type: targetType, src: it2[0], cap: it2[1] }
        );
      } else {
        curItem.type = targetType;
      }
      window.AdminState.hasUnsavedChanges = true;
      renderRoomItems(room, gridContainer, proj);
      showToast('Диптих разделен на два отдельных ракурса', 'info');
      return;
    }

    if (curItem.type !== 'diptych' && targetType === 'diptych') {
      // full -> diptych: объединяем выбранный элемент со следующим в комнате
      if (itemIdx < room.items.length - 1) {
        const nextItem = room.items[itemIdx + 1];
        let src1 = curItem.src || '';
        let cap1 = curItem.cap || '';
        let src2 = nextItem.src || '';
        let cap2 = nextItem.cap || '';

        if (nextItem.type === 'diptych' && nextItem.items?.[0]) {
          src2 = nextItem.items[0][0];
          cap2 = nextItem.items[0][1];
        }

        const diptychObj = {
          type: 'diptych',
          items: [
            [src1, cap1],
            [src2, cap2]
          ]
        };
        room.items.splice(itemIdx, 2, diptychObj);
        window.AdminState.hasUnsavedChanges = true;
        renderRoomItems(room, gridContainer, proj);
        showToast('Ракурсы объединены в диптих (сетка по 2 в ряд)', 'info');
      } else {
        alert('Для создания диптиха требуется еще один ракурс в помещении. Добавьте следующий ракурс перед объединением.');
        layoutSel.value = curItem.type || 'full';
      }
      return;
    }

    curItem.type = targetType;
    window.AdminState.hasUnsavedChanges = true;
    showToast('Тип раскладки обновлен', 'info');
  };

  card.querySelector('.render-btn-delete').onclick = () => {
    if (confirm('Удалить данный ракурс из помещения?')) {
      if (src && window.AdminState.newFilesMap.has(src)) {
        window.AdminState.newFilesMap.delete(src);
      }
      if (subIdx !== null && room.items[itemIdx]?.items) {
        const otherIdx = subIdx === 0 ? 1 : 0;
        const otherItem = room.items[itemIdx].items[otherIdx];
        if (otherItem) {
          room.items.splice(itemIdx, 1, {
            type: 'full',
            src: otherItem[0],
            cap: otherItem[1]
          });
        } else {
          room.items.splice(itemIdx, 1);
        }
      } else {
        room.items.splice(itemIdx, 1);
      }
      window.AdminState.hasUnsavedChanges = true;
      renderRoomItems(room, gridContainer, proj);
      showToast('Ракурс удален', 'info');
    }
  };

  return card;
}

function transliterateSlug(str) {
  const ruMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  return String(str || '')
    .toLowerCase()
    .split('')
    .map(c => ruMap[c] !== undefined ? ruMap[c] : c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `case-${Date.now()}`;
}

function createNewProjectDialog() {
  const title = prompt('Введите название нового проекта (например: ЖК «Кандинский»):');
  if (!title || !title.trim()) return;

  const slug = transliterateSlug(title);
  const newProj = {
    id: `project-${Date.now()}`,
    filename: `project-${slug}.html`,
    folder: slug.toUpperCase().replace(/-/g, '_'),
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
