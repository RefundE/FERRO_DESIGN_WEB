document.addEventListener('DOMContentLoaded', () => {
  const hwTitle = document.getElementById('hwTitle');
  const tabButtons = document.querySelectorAll('.hw-tab-btn');
  const portfolioLink = document.querySelector('.js-portfolio-link');
  const projectCards = document.querySelectorAll('.hw-card');

  // 1. Клик по «Портфолио» плавно возвращает наверх
  if (portfolioLink) {
    portfolioLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 2. Двойная фильтрация на странице «Все проекты»: по типу объекта и по площади
  const typeButtons = document.querySelectorAll('.js-type-filter, .hw-tab-btn');
  const areaButtons = document.querySelectorAll('.js-area-filter');
  let activeTypeFilter = 'all';
  let activeAreaFilter = 'all';

  function applyProjectsFilter(titleText) {
    if (hwTitle && titleText && hwTitle.textContent !== titleText) {
      hwTitle.style.opacity = '0';
      hwTitle.style.transform = 'translateY(-8px)';
      setTimeout(() => {
        hwTitle.textContent = titleText;
        hwTitle.style.opacity = '1';
        hwTitle.style.transform = 'translateY(0)';
      }, 180);
    }

    projectCards.forEach(card => {
      const category = card.getAttribute('data-category') || '';
      const areaVal = parseFloat(card.getAttribute('data-area') || '0');

      const matchesType = (activeTypeFilter === 'all' || category === activeTypeFilter);
      let matchesArea = true;
      if (activeAreaFilter === 'under100') {
        matchesArea = areaVal > 0 && areaVal < 100;
      } else if (activeAreaFilter === '100to200') {
        matchesArea = areaVal >= 100 && areaVal <= 200;
      } else if (activeAreaFilter === 'over200') {
        matchesArea = areaVal >= 200;
      }

      if (matchesType && matchesArea) {
        if (card._hideTimer) {
          clearTimeout(card._hideTimer);
          card._hideTimer = null;
        }
        card.classList.remove('is-hidden');
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 20);
      } else {
        card.style.opacity = '0';
        card.style.transform = 'translateY(12px)';
        if (card._hideTimer) clearTimeout(card._hideTimer);
        card._hideTimer = setTimeout(() => {
          card.classList.add('is-hidden');
          card._hideTimer = null;
        }, 200);
      }
    });
  }

  function scrollFilterPill(btn) {
    const parent = btn.parentElement;
    if (!parent) return;
    const pRect = parent.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    const offset = (bRect.left + bRect.width / 2) - (pRect.left + pRect.width / 2);
    parent.scrollBy({ left: offset, behavior: 'smooth' });
  }

  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      activeTypeFilter = btn.getAttribute('data-filter-type') || btn.getAttribute('data-filter') || 'all';
      typeButtons.forEach(b => b.classList.toggle('active', b === btn));
      applyProjectsFilter(btn.getAttribute('data-title'));
      scrollFilterPill(btn);
    });
  });

  areaButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      activeAreaFilter = btn.getAttribute('data-filter-area') || 'all';
      areaButtons.forEach(b => b.classList.toggle('active', b === btn));
      applyProjectsFilter(null);
      scrollFilterPill(btn);
    });
  });

  // 3. Бесшовный микро-наклон (0.6°) для мыши
  const isTouchDevice = window.matchMedia('(hover: none)').matches;
  if (!isTouchDevice) {
    const tiltElements = document.querySelectorAll('.hw-image-wrap, .js-tilt');

    tiltElements.forEach(el => {
      const img = el.querySelector('img');
      el.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)';
      if (img) img.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)';

      let rect = null;
      let rafId = null;

      const updateRect = () => {
        rect = el.getBoundingClientRect();
      };

      el.addEventListener('mouseenter', () => {
        updateRect();
        el.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)';
        if (img) img.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)';
      });

      window.addEventListener('resize', updateRect, { passive: true });

      el.addEventListener('mousemove', (e) => {
        if (!rect) updateRect();
        const clientX = e.clientX;
        const clientY = e.clientY;

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const x = clientX - rect.left;
          const y = clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;

          const rotateX = ((y - centerY) / centerY) * -0.6;
          const rotateY = ((x - centerX) / centerX) * 0.6;

          el.style.transform = `perspective(2500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`;

          if (img) {
            const moveX = ((x - centerX) / centerX) * -1.2;
            const moveY = ((y - centerY) / centerY) * -1.2;
            img.style.transform = `scale(1.02) translate3d(${moveX}px, ${moveY}px, 0)`;
          }
        });
      });

      el.addEventListener('mouseleave', () => {
        if (rafId) cancelAnimationFrame(rafId);
        el.style.transition = 'transform 0.5s ease-out';
        el.style.transform = 'perspective(2500px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        if (img) {
          img.style.transition = 'transform 0.5s ease-out';
          img.style.transform = 'scale(1) translate3d(0, 0, 0)';
        }
      });
    });
  }

  // 4. Полноэкранный Lightbox (активен строго внутри страниц кейсов)
  const projectBody = document.querySelector('.project-body');
  if (projectBody) {
    const galleryImages = Array.from(projectBody.querySelectorAll('img'));

    if (galleryImages.length > 0) {
      const lightbox = document.createElement('div');
      lightbox.className = 'lightbox-overlay';
      lightbox.innerHTML = `
        <div class="lightbox-counter"></div>
        <button class="lightbox-btn lightbox-close" title="Закрыть (Esc)" aria-label="Закрыть">
          <svg class="lightbox-close-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" stroke-linejoin="miter"/>
          </svg>
        </button>
        <button class="lightbox-btn lightbox-prev" title="Назад (←)" aria-label="Предыдущий кадр">
          <svg class="lightbox-arrow-svg" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 12H6M6 12L15 4M6 12L15 20" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" stroke-linejoin="miter"/>
          </svg>
        </button>
        <button class="lightbox-btn lightbox-next" title="Вперед (→)" aria-label="Следующий кадр">
          <svg class="lightbox-arrow-svg" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 12H30M30 12L21 4M30 12L21 20" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" stroke-linejoin="miter"/>
          </svg>
        </button>
        <div class="lightbox-content">
          <img src="" alt="Fullscreen Render" class="lightbox-img">
          <div class="lightbox-caption"></div>
        </div>
      `;
      document.body.appendChild(lightbox);

      const lightboxImg = lightbox.querySelector('.lightbox-img');
      const lightboxCaption = lightbox.querySelector('.lightbox-caption');
      const lightboxCounter = lightbox.querySelector('.lightbox-counter');
      const closeBtn = lightbox.querySelector('.lightbox-close');
      const prevBtn = lightbox.querySelector('.lightbox-prev');
      const nextBtn = lightbox.querySelector('.lightbox-next');

      let currentIndex = 0;

      function getRoomTitle(img) {
        const headers = Array.from(projectBody.querySelectorAll('.room-header'));
        let foundRoom = '';
        for (const header of headers) {
          if (header.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_FOLLOWING) {
            const nameEl = header.querySelector('.room-name');
            if (nameEl && nameEl.textContent.trim()) {
              foundRoom = nameEl.textContent.trim();
            }
          }
        }
        if (foundRoom) return foundRoom;

        const alt = img.getAttribute('alt') || '';
        if (alt.includes('—')) return alt.split('—')[0].trim();
        return alt || '';
      }

      function showImage(index) {
        if (index < 0) index = galleryImages.length - 1;
        if (index >= galleryImages.length) index = 0;
        currentIndex = index;

        const targetImg = galleryImages[currentIndex];
        lightboxImg.src = targetImg.src;
        lightboxCaption.textContent = getRoomTitle(targetImg);
        if (lightboxCounter) {
          lightboxCounter.textContent = `${currentIndex + 1} / ${galleryImages.length}`;
        }
      }

      function openLightbox(index) {
        showImage(index);
        lightbox.classList.add('is-active');
        document.body.classList.add('has-lightbox-open');
        document.body.style.overflow = 'hidden';
      }

      function closeLightbox() {
        lightbox.classList.remove('is-active');
        document.body.classList.remove('has-lightbox-open');
        document.body.style.overflow = '';
      }

      galleryImages.forEach((img, idx) => {
        img.addEventListener('click', (e) => {
          e.stopPropagation();
          openLightbox(idx);
        });
      });

      closeBtn.addEventListener('click', closeLightbox);
      lightboxImg.addEventListener('click', closeLightbox);
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content')) closeLightbox();
      });

      prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex - 1); });
      nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex + 1); });

      // Сенсорные свайпы влево / вправо для мобильных устройств
      let touchStartX = 0;
      let touchStartY = 0;

      lightbox.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      lightbox.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches.length === 1) {
          const deltaX = e.changedTouches[0].clientX - touchStartX;
          const deltaY = e.changedTouches[0].clientY - touchStartY;

          if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < 0) {
              showImage(currentIndex + 1);
            } else {
              showImage(currentIndex - 1);
            }
          }
        }
      }, { passive: true });

      document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('is-active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
        if (e.key === 'ArrowRight') showImage(currentIndex + 1);
      });
    }
  }
// ============================================================
  // ============================================================
  // ДИНАМИЧЕСКИЙ ФАВИКОН В СТИЛЕ YODEZEEN (F - E - R - R - O каждые 0.5s)
  // ============================================================
  const faviconLetters = ['F', 'E', 'R', 'R', 'O'];
  const favSize = 64; // Высокое разрешение для Retina/HiDPI вкладок
  const cachedFavicons = [];
  let currentFavIndex = 0;
  let faviconInterval = null;

  function generateFaviconFrames() {
    cachedFavicons.length = 0;
    const canvas = document.createElement('canvas');
    canvas.width = favSize;
    canvas.height = favSize;
    const ctx = canvas.getContext('2d');

    // 1. Предварительная генерация 5 кадров в память (кэш)
    faviconLetters.forEach((char) => {
      ctx.clearRect(0, 0, favSize, favSize);

      // Белый квадратный фон как у YoDezeen
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, favSize, favSize);

      // Чёрная буква шрифтом 1 ТИПА (Unbounded, 900)
      ctx.fillStyle = '#111111';
      ctx.font = '900 42px "Unbounded", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Оптическая центровка буквы по вертикали
      ctx.fillText(char, favSize / 2, favSize / 2 + 2);

      cachedFavicons.push(canvas.toDataURL('image/png'));
    });
  }

  // 2. Функция ротации кадров с заменой DOM-элемента для Chromium/Firefox
  function rotateFavicon() {
    if (cachedFavicons.length === 0) return;

    const newLink = document.createElement('link');
    newLink.id = 'dynamicFavicon';
    newLink.rel = 'icon';
    newLink.type = 'image/png';
    newLink.href = cachedFavicons[currentFavIndex];

    const allIcons = document.querySelectorAll("link[rel*='icon']");
    if (allIcons.length > 0) {
      allIcons[0].parentNode.replaceChild(newLink, allIcons[0]);
      for (let i = 1; i < allIcons.length; i++) {
        allIcons[i].remove();
      }
    } else {
      document.head.appendChild(newLink);
    }

    currentFavIndex = (currentFavIndex + 1) % cachedFavicons.length;
  }

  function startFavicon() {
    if (!faviconInterval) {
      faviconInterval = setInterval(rotateFavicon, 500);
    }
  }

  function stopFavicon() {
    if (faviconInterval) {
      clearInterval(faviconInterval);
      faviconInterval = null;
    }
  }

  let isFaviconReady = false;
  function initDynamicFavicon() {
    if (isFaviconReady) return;
    isFaviconReady = true;
    generateFaviconFrames();
    rotateFavicon();
    startFavicon();
  }

  // Ожидаем готовность шрифта Unbounded для кристально чёткой отрисовки букв
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      initDynamicFavicon();
    });
    setTimeout(initDynamicFavicon, 300);
  } else {
    setTimeout(initDynamicFavicon, 100);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopFavicon();
    } else {
      startFavicon();
    }
  });

// 6. Анимация увеличения цифр в блоке «О нас» при скролле от блока услуг
  const statsSection = document.querySelector('.about-stats-grid');
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');

  if (statsSection && statNumbers.length > 0) {
    let hasAnimated = false;

    function formatNumber(val, formatType) {
      if (formatType === 'space') {
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      }
      return val.toString();
    }

    function animateStats() {
      if (hasAnimated) return;
      hasAnimated = true;

      const duration = 1800; // 1.8 секунды плавной анимации
      const startTime = performance.now();

      const targets = Array.from(statNumbers).map(el => ({
        el,
        target: parseInt(el.getAttribute('data-target') || '0', 10),
        suffix: el.getAttribute('data-suffix') || '',
        format: el.getAttribute('data-format') || ''
      }));

      function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Плавная кубическая кривая замедления (easeOutCubic)
        const ease = 1 - Math.pow(1 - progress, 3);

        targets.forEach(item => {
          const currentVal = Math.round(ease * item.target);
          item.el.textContent = formatNumber(currentVal, item.format) + item.suffix;
        });

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          targets.forEach(item => {
            item.el.textContent = formatNumber(item.target, item.format) + item.suffix;
          });
        }
      }

      requestAnimationFrame(updateCounter);
    }

    if ('IntersectionObserver' in window) {
      const statsObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateStats();
            obs.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.2, // Срабатывает, когда 20% карточки появляется при скролле
        rootMargin: '0px 0px -40px 0px'
      });

      statsObserver.observe(statsSection);
    } else {
      animateStats();
    }
  }

// 7. Автоматическая маска телефона (+7) при вводе номера в форме заявки (поддержка Telegram)
  const phoneInputs = document.querySelectorAll('#userPhone, input[name="contact"], input[placeholder*="+7"]');

  phoneInputs.forEach(phoneInput => {
    // Если ничего кроме префикса не ввели — при уходе очищаем поле
    phoneInput.addEventListener('blur', () => {
      const trimmed = phoneInput.value.trim();
      if (trimmed === '+7' || trimmed === '+7 (' || trimmed === '+7 ()') {
        phoneInput.value = '';
      }
    });

    // Очистка при стирании клавишей Backspace
    phoneInput.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && (phoneInput.value === '+7 (' || phoneInput.value === '+7')) {
        phoneInput.value = '';
      }
    });

    // Форматирование при вводе цифр
    phoneInput.addEventListener('input', () => {
      const val = phoneInput.value;

      // Если ввод содержит буквы (латиница/кириллица) или @ (ник Telegram), не форматируем как телефон
      if (/[a-zA-Zа-яА-ЯёЁ@]/.test(val)) return;

      const digits = val.replace(/\D/g, '');
      if (!digits) {
        phoneInput.value = '';
        return;
      }

      // Отсекаем начальную 7 или 8, чтобы не дублировать код страны
      let bodyDigits = digits;
      if (digits[0] === '7' || digits[0] === '8') {
        bodyDigits = digits.substring(1);
      }

      let formatted = '+7';
      if (bodyDigits.length > 0) {
        formatted += ' (' + bodyDigits.substring(0, 3);
      }
      if (bodyDigits.length >= 4) {
        formatted += ') ' + bodyDigits.substring(3, 6);
      }
      if (bodyDigits.length >= 7) {
        formatted += '-' + bodyDigits.substring(6, 8);
      }
      if (bodyDigits.length >= 9) {
        formatted += '-' + bodyDigits.substring(8, 10);
      }

      phoneInput.value = formatted;
    });
  });

// 8. Плавная кроссфейд-ротация фоновых фотографий первого экрана из папки COVER_MAIN
  const heroMedia = document.querySelector('.hero-bg-media');
  if (heroMedia) {
    let slides = heroMedia.querySelectorAll('.hero-bg-slide');

    if (slides.length < 2) {
      const existing = heroMedia.querySelector('img');
      if (existing) existing.classList.add('hero-bg-slide', 'active');
      const secondSlide = document.createElement('img');
      secondSlide.className = 'hero-bg-slide';
      secondSlide.alt = 'Интерьер';
      heroMedia.appendChild(secondSlide);
      slides = heroMedia.querySelectorAll('.hero-bg-slide');
    }

    if (slides.length >= 2) {
      const slideA = slides[0];
      const slideB = slides[1];

      // Список фотографий для плавного переключения (на телефонах: 3 вертикальных рендера гостиной Некрасова)
      const desktopImages = [
        'images/COVER_MAIN/cover_main_makarovski.webp',
        'images/COVER_MAIN/cover_main_nekrasova.webp'
      ];
      const mobileImages = [
        'images/NA_NEKRASOVA/living_04.webp',
        'images/NA_NEKRASOVA/living_05.webp',
        'images/NA_NEKRASOVA/living_06.webp'
      ];

      const isMobile = window.matchMedia('(max-width: 960px)').matches;
      const candidateImages = isMobile ? mobileImages : desktopImages;

      if (isMobile) {
        slideA.src = candidateImages[0];
      }

      // Фильтруем только те файлы, которые реально присутствуют в папке
      const availableImages = [];
      let checkedCount = 0;

      candidateImages.forEach(src => {
        const testImg = new Image();
        testImg.onload = () => {
          if (!availableImages.includes(src)) availableImages.push(src);
          checkedCount++;
          if (checkedCount === candidateImages.length && availableImages.length > 1) {
            startHeroSlideshow();
          }
        };
        testImg.onerror = () => {
          checkedCount++;
          if (checkedCount === candidateImages.length && availableImages.length > 1) {
            startHeroSlideshow();
          }
        };
        testImg.src = src;
      });

      function startHeroSlideshow() {
        let currentIdx = 0;
        let isSlideAActive = true;

        if (availableImages[0]) {
          slideA.src = availableImages[0];
        }

        // Переключение каждые 6 секунд с мягким растворением (1.8 с)
        setInterval(() => {
          currentIdx = (currentIdx + 1) % availableImages.length;
          const nextSrc = availableImages[currentIdx];

          if (isSlideAActive) {
            slideB.src = nextSrc;
            slideB.classList.add('active');
            slideA.classList.remove('active');
          } else {
            slideA.src = nextSrc;
            slideA.classList.add('active');
            slideB.classList.remove('active');
          }

          isSlideAActive = !isSlideAActive;
        }, 6000);
      }
    }
  }


  // 9. Выдвигающаяся надпись FERRO DESIGN в подвале (приходит в конечную точку строго в самом низу сайта)
  const brandTitle = document.getElementById('footerBrandTitle');
  if (brandTitle) {
    let isTicking = false;

    function updateFooterBrandPosition() {
      const windowH = window.innerHeight;
      const scrollY = window.scrollY || window.pageYOffset;
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );

      // Конечная точка — самый низ сайта (максимальный возможный scrollY)
      const maxScrollY = Math.max(1, docHeight - windowH);
      // Дистанция анимации перед самым низом страницы (около 380px прокрутки по футеру)
      const animRange = Math.min(380, windowH * 0.55);
      const startScrollY = Math.max(0, maxScrollY - animRange);

      const rawProgress = (scrollY - startScrollY) / Math.max(1, maxScrollY - startScrollY);
      const progress = Math.max(0, Math.min(1, rawProgress));

      // Движение слева направо: достигает 0px строго в самом низу страницы (при progress === 1)
      const currentTranslateX = (1 - progress) * -180;
      const currentOpacity = progress;

      brandTitle.style.transform = `translate3d(${currentTranslateX}px, 0, 0)`;
      brandTitle.style.opacity = currentOpacity;

      isTicking = false;
    }

    window.addEventListener('scroll', () => {
      if (!isTicking) {
        requestAnimationFrame(updateFooterBrandPosition);
        isTicking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', updateFooterBrandPosition, { passive: true });
    updateFooterBrandPosition();
  }

  // 10. Плавающая навигация по помещениям в стиле Hot Walls (скрывается перед «Следующий проект»)
  const roomNav = document.getElementById('hwRoomNav');
  const roomHeaders = Array.from(document.querySelectorAll('.room-header[id]'));
  const roomLinks = Array.from(document.querySelectorAll('.hw-room-link'));

  if (roomNav && roomHeaders.length > 0 && projectBody) {
    let lastActiveRoomLink = null;

    function scrollRoomNavToLink(link) {
      if (!roomNav || !link) return;
      const navRect = roomNav.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      const offset = (linkRect.left + linkRect.width / 2) - (navRect.left + navRect.width / 2);
      roomNav.scrollBy({ left: offset, behavior: 'smooth' });
    }

    function updateRoomNav() {
      const bodyRect = projectBody.getBoundingClientRect();
      const nextBar = document.querySelector('.next-case-bar');
      const bottomLimit = nextBar ? nextBar.getBoundingClientRect().top : bodyRect.bottom;
      const windowH = window.innerHeight;

      const isInsideGallery = bodyRect.top < windowH * 0.65 && bottomLimit > windowH * 0.80;
      roomNav.classList.toggle('is-visible', isInsideGallery);

      let currentRoomId = roomHeaders[0].id;
      roomHeaders.forEach(header => {
        const rect = header.getBoundingClientRect();
        if (rect.top <= windowH * 0.45) {
          currentRoomId = header.id;
        }
      });

      let activeRoomLink = null;
      roomLinks.forEach(link => {
        const isActive = (link.getAttribute('href') === '#' + currentRoomId);
        link.classList.toggle('active', isActive);
        if (isActive) activeRoomLink = link;
      });

      if (activeRoomLink && activeRoomLink !== lastActiveRoomLink) {
        lastActiveRoomLink = activeRoomLink;
        scrollRoomNavToLink(activeRoomLink);
      }
    }

    roomLinks.forEach(link => {
      link.addEventListener('click', () => {
        scrollRoomNavToLink(link);
      });
    });

    let isRoomNavTicking = false;
    window.addEventListener('scroll', () => {
      if (!isRoomNavTicking) {
        requestAnimationFrame(() => {
          updateRoomNav();
          isRoomNavTicking = false;
        });
        isRoomNavTicking = true;
      }
    }, { passive: true });
    updateRoomNav();
  }

  // 11. Автоматическое выравнивание высоты парных рендеров в одном ряду (.diptych-grid)
  const diptychGrids = document.querySelectorAll('.diptych-grid');
  diptychGrids.forEach(grid => {
    const imgs = Array.from(grid.querySelectorAll('img'));
    if (imgs.length < 2) return;

    function syncRowAspect() {
      const r1 = (imgs[0].naturalWidth && imgs[0].naturalHeight)
        ? (imgs[0].naturalWidth / imgs[0].naturalHeight)
        : 0;
      const r2 = (imgs[1].naturalWidth && imgs[1].naturalHeight)
        ? (imgs[1].naturalWidth / imgs[1].naturalHeight)
        : 0;

      if (r1 > 0 && r2 > 0) {
        const targetRatio = Math.max(r1, r2);
        grid.style.setProperty('--row-aspect', targetRatio.toFixed(4));
      }
    }

    imgs.forEach(img => {
      if (img.complete) {
        syncRowAspect();
      } else {
        img.addEventListener('load', syncRowAspect);
      }
    });
  });

  // 12. Интерактивный переключатель сценариев освещения (ДЕНЬ / НОЧЬ)
  const heroLightingSwitch = document.querySelector('.lighting-mode-switch');
  const projectIntro = document.querySelector('.project-intro');

  if (heroLightingSwitch && projectIntro) {
    const modeBtns = heroLightingSwitch.querySelectorAll('.lighting-mode-btn');

    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetMode = btn.getAttribute('data-mode');
        if (btn.classList.contains('is-active')) return;

        modeBtns.forEach(b => {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });

        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');

        if (targetMode === 'night') {
          projectIntro.classList.add('is-night-mode');
        } else {
          projectIntro.classList.remove('is-night-mode');
        }
      });
    });
  }

  // 13. Баннер согласия на использование файлов cookie (152-ФЗ РФ)
  const COOKIE_STORAGE_KEY = 'ferro_cookies_consent';
  let hasAcceptedCookies = false;
  try {
    hasAcceptedCookies = localStorage.getItem(COOKIE_STORAGE_KEY);
  } catch (e) {
    hasAcceptedCookies = false;
  }

  if (!hasAcceptedCookies) {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.id = 'cookieBanner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Уведомление об использовании cookie');
    banner.innerHTML = `
      <div class="cookie-content">
        <div class="cookie-text">
          Мы используем файлы cookie и сервисы сбора технических данных для персонализации и корректной работы сайта. Оставаясь на сайте, вы соглашаетесь с условиями <a href="privacy.html">Политики конфиденциальности</a>.
        </div>
        <div class="cookie-actions">
          <button type="button" class="cookie-accept-btn" id="cookieAcceptBtn">Принять</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    // Плавное появление через 800мс
    setTimeout(() => {
      banner.classList.add('is-visible');
    }, 800);

    const acceptBtn = banner.querySelector('#cookieAcceptBtn');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        try {
          localStorage.setItem(COOKIE_STORAGE_KEY, 'accepted');
        } catch (e) {}
        banner.classList.remove('is-visible');
        setTimeout(() => {
          banner.remove();
        }, 500);
      });
    }
  }

  // 14. Премиальное модальное окно успешной отправки заявки (Glassmorphic Modal)
  function showFeedbackSuccessModal(userName) {
    let modal = document.getElementById('feedbackModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'feedback-modal-overlay';
      modal.id = 'feedbackModal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.innerHTML = `
        <div class="feedback-modal-card">
          <button type="button" class="feedback-modal-close" id="feedbackModalClose" aria-label="Закрыть">&times;</button>
          <div class="feedback-modal-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h3 class="feedback-modal-title">ЗАЯВКА ПРИНЯТА</h3>
          <p class="feedback-modal-text" id="feedbackModalMsg">Спасибо за обращение! Мы свяжемся с вами в течение 30 минут для обсуждения деталей вашего проекта.</p>
          <button type="button" class="feedback-modal-btn" id="feedbackModalOk">ОТЛИЧНО</button>
        </div>
      `;
      document.body.appendChild(modal);

      const closeModal = () => {
        modal.classList.remove('is-active');
      };

      modal.querySelector('#feedbackModalClose').addEventListener('click', closeModal);
      modal.querySelector('#feedbackModalOk').addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-active')) closeModal();
      });
    }

    const msgEl = modal.querySelector('#feedbackModalMsg');
    if (msgEl) {
      const cleanName = (userName || '').trim();
      if (cleanName) {
        msgEl.textContent = `Спасибо, ${cleanName}! Мы свяжемся с вами в течение 30 минут для обсуждения деталей вашего проекта.`;
      } else {
        msgEl.textContent = `Спасибо за обращение! Мы свяжемся с вами в течение 30 минут для обсуждения деталей вашего проекта.`;
      }
    }

    requestAnimationFrame(() => {
      modal.classList.add('is-active');
    });
  }

  function showFeedbackErrorModal(errorMsg) {
    let modal = document.getElementById('feedbackErrorModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'feedbackErrorModal';
      modal.className = 'feedback-modal-overlay';
      modal.innerHTML = `
        <div class="feedback-modal-card">
          <button type="button" class="feedback-modal-close" id="feedbackErrorModalClose" aria-label="Закрыть">&times;</button>
          <div class="feedback-modal-icon" style="color: #c88f0a;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 class="feedback-modal-title">Не удалось отправить заявку</h3>
          <p class="feedback-modal-text" id="feedbackErrorModalMsg">Пожалуйста, напишите нам напрямую в Telegram <a href="https://t.me/ferrodesign_ekb" target="_blank" rel="noopener" style="color: #c88f0a; text-decoration: underline;">@ferrodesign_ekb</a> или на почту <a href="mailto:artem1-nt@mail.ru" style="color: #c88f0a; text-decoration: underline;">artem1-nt@mail.ru</a>.</p>
          <button type="button" class="feedback-modal-btn" id="feedbackErrorModalOk">ПОНЯТНО</button>
        </div>
      `;
      document.body.appendChild(modal);

      const closeModal = () => {
        modal.classList.remove('is-active');
      };

      modal.querySelector('#feedbackErrorModalClose').addEventListener('click', closeModal);
      modal.querySelector('#feedbackErrorModalOk').addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-active')) closeModal();
      });
    }

    if (errorMsg) {
      const msgEl = modal.querySelector('#feedbackErrorModalMsg');
      if (msgEl) msgEl.innerHTML = errorMsg;
    }

    requestAnimationFrame(() => {
      modal.classList.add('is-active');
    });
  }

  // Перехват всех форм контактов на сайте и отправка через FormSubmit
  document.querySelectorAll('.contact-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = form.querySelector('input[name="name"]') || form.querySelector('input[type="text"]');
      const userName = nameInput ? nameInput.value : '';
      const submitBtn = form.querySelector('.btn-submit') || form.querySelector('button[type="submit"]');

      const formData = new FormData(form);

      // Антиспам-проверка honeypot
      if (formData.get('website')) {
        return; // Спам-бот заполнил скрытое поле
      }

      let origBtnText = '';
      if (submitBtn) {
        origBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
      }

      const payload = {
        _subject: 'Новая заявка с сайта FERRO DESIGN',
        _template: 'table',
        _captcha: 'false',
        'Имя': formData.get('name') || '',
        'Контакт': formData.get('contact') || formData.get('phone') || '',
        'Город': formData.get('city') || '',
        'Площадь': formData.get('area') || '',
        'Комментарий': formData.get('comment') || formData.get('message') || '',
        'Страница': window.location.href
      };

      fetch('https://formsubmit.co/ajax/artem1-nt@mail.ru', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) throw new Error('Network error: ' + res.status);
        return res.json();
      })
      .then(data => {
        if (data && (data.success === 'false' || data.success === false)) {
          throw new Error(data.message || 'FormSubmit rejected submission');
        }
        showFeedbackSuccessModal(userName);
        form.reset();
      })
      .catch((err) => {
        const isHttp = window.location.protocol === 'http:' || window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if (isHttp && !isLocalhost) {
          console.error('Ошибка отправки формы:', err);
          showFeedbackErrorModal('Не удалось отправить заявку. Пожалуйста, напишите нам напрямую в Telegram <a href="https://t.me/ferrodesign_ekb" target="_blank" rel="noopener" style="color: #c88f0a; text-decoration: underline;">@ferrodesign_ekb</a> или на почту <a href="mailto:artem1-nt@mail.ru" style="color: #c88f0a; text-decoration: underline;">artem1-nt@mail.ru</a>.');
        } else {
          // Локальное тестирование (file:// или localhost)
          showFeedbackSuccessModal(userName);
          form.reset();
        }
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = origBtnText;
        }
      });
    });
  });

  // 15. Мобильные вертикальные кавер-рендеры (только спальня, гостиная или кухня; без санузлов)
  if (window.matchMedia('(max-width: 960px)').matches) {
    const mobileCoverMap = {
      'images/COVER_MAIN/cover_main_nekrasova.webp': 'images/NA_NEKRASOVA/living_04.webp',
      'images/NA_NEKRASOVA/cover.webp': 'images/NA_NEKRASOVA/living_04.webp',
      'images/ARTU_40M2/living_01.webp': 'images/ARTU_40M2/living_03.webp',
      'images/HMAO/living_01.webp': 'images/HMAO/living_06.webp',
      'images/SUOMEN/cover.webp': 'images/SUOMEN/kids_01.webp'
    };

    document.querySelectorAll('.hero-bg-layer, .card-media-wrap img, .hw-card-media img').forEach(img => {
      const src = img.getAttribute('src');
      if (src && mobileCoverMap[src]) {
        img.src = mobileCoverMap[src];
      }
    });
  }

  // 16. Динамическое плавное кинематографичное чередование названия на главной: 5 сек "FERRO DESIGN" / 5 сек "ФЕРРО ДИЗАЙН"
  // (Соответствие ст. 68 Конституции РФ и 53-ФЗ «О государственном языке РФ»)
  const heroDynamicTitle = document.querySelector('.hero-main-title .hero-title-word');
  if (heroDynamicTitle) {
    const titles = ['FERRO DESIGN', 'ФЕРРО ДИЗАЙН'];
    let titleIdx = 0;

    // Снимаем блокировку CSS keyframe animation после завершения первого появления
    const clearInitialAnimation = () => {
      heroDynamicTitle.style.animation = 'none';
      heroDynamicTitle.style.opacity = '1';
      heroDynamicTitle.style.transform = 'translateY(0)';
      heroDynamicTitle.style.filter = 'blur(0)';
    };

    heroDynamicTitle.addEventListener('animationend', clearInitialAnimation, { once: true });
    setTimeout(clearInitialAnimation, 2800); // Резервный таймер

    // Цикл переключения каждые 5 секунд
    setInterval(() => {
      // 1. Плавный уход текущего названия вверх с растворением и кинетическим блюром
      heroDynamicTitle.classList.remove('title-fade-prep');
      heroDynamicTitle.classList.add('title-fade-out');

      setTimeout(() => {
        // 2. Смена текста в момент полной невидимости
        titleIdx = (titleIdx + 1) % titles.length;
        heroDynamicTitle.textContent = titles[titleIdx];

        // 3. Мгновенная посадка снизу для плавного восхождения
        heroDynamicTitle.classList.remove('title-fade-out');
        heroDynamicTitle.classList.add('title-fade-prep');

        // Принудительный reflow браузера
        void heroDynamicTitle.offsetWidth;

        // 4. Плавное всплытие снизу в идеальный фокус
        heroDynamicTitle.classList.remove('title-fade-prep');
      }, 650);
    }, 5000);
  }

});