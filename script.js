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

  // 2. Переключение 4 вкладок: Квартиры / Дома / Коммерческие / Все проекты
  function setCategory(filterValue, titleText) {
    if (hwTitle && titleText && hwTitle.textContent !== titleText) {
      hwTitle.style.opacity = '0';
      hwTitle.style.transform = 'translateY(-8px)';

      setTimeout(() => {
        hwTitle.textContent = titleText;
        hwTitle.style.opacity = '1';
        hwTitle.style.transform = 'translateY(0)';
      }, 180);
    }

    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-filter') === filterValue);
    });

    projectCards.forEach(card => {
      const category = card.getAttribute('data-category');
      if (filterValue === 'all' || category === filterValue) {
        card.classList.remove('is-hidden');
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 20);
      } else {
        card.style.opacity = '0';
        card.style.transform = 'translateY(12px)';
        setTimeout(() => {
          card.classList.add('is-hidden');
        }, 200);
      }
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setCategory(btn.getAttribute('data-filter'), btn.getAttribute('data-title'));
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

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
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

      el.addEventListener('mouseleave', () => {
        el.style.transition = 'transform 0.5s ease-out';
        el.style.transform = 'perspective(2500px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        if (img) {
          img.style.transition = 'transform 0.5s ease-out';
          img.style.transform = 'scale(1) translate3d(0, 0, 0)';
        }
      });

      el.addEventListener('mouseenter', () => {
        el.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)';
        if (img) img.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)';
      });
    });
  }

  // 4. Полноэкранный Lightbox (активен строго внутри страниц кейсов)
  const projectBody = document.querySelector('.project-body');
  if (projectBody) {
    const galleryImages = Array.from(projectBody.querySelectorAll('img'));

    if (galleryImages.length > 0) {
      if (!document.getElementById('injected-lightbox-css')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'injected-lightbox-css';
        styleTag.textContent = `
          .project-body img { cursor: zoom-in !important; }
          .lightbox-overlay {
            position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important;
            background: rgba(0, 0, 0, 0.94) !important; backdrop-filter: blur(25px) saturate(140%) !important;
            -webkit-backdrop-filter: blur(25px) saturate(140%) !important; display: flex !important;
            justify-content: center !important; align-items: center !important; z-index: 999999 !important;
            opacity: 0 !important; pointer-events: none !important; transition: opacity 0.3s ease !important;
          }
          .lightbox-overlay.is-active { opacity: 1 !important; pointer-events: auto !important; }
          .lightbox-content { position: relative !important; max-width: 95vw !important; max-height: 92vh !important; display: flex !important; flex-direction: column !important; align-items: center !important; }
          .lightbox-img { max-width: 94vw !important; max-height: 85vh !important; object-fit: contain !important; border-radius: 8px !important; box-shadow: 0 25px 70px rgba(0, 0, 0, 0.8) !important; cursor: zoom-out !important; }
          .lightbox-caption { color: rgba(255, 255, 255, 0.8) !important; font-size: 13px !important; margin-top: 14px !important; font-family: 'Inter', sans-serif !important; }
          .lightbox-btn {
            position: absolute !important; background: rgba(255, 255, 255, 0.12) !important; backdrop-filter: blur(16px) !important;
            border: 1px solid rgba(255, 255, 255, 0.35) !important; color: #ffffff !important; border-radius: 50% !important;
            width: 52px !important; height: 52px !important; display: flex !important; align-items: center !important; justify-content: center !important;
            font-size: 20px !important; cursor: pointer !important; z-index: 1000000 !important;
          }
          .lightbox-close { top: 24px !important; right: 28px !important; }
          .lightbox-prev { left: 28px !important; top: 50% !important; transform: translateY(-50%) !important; }
          .lightbox-next { right: 28px !important; top: 50% !important; transform: translateY(-50%) !important; }
          @media (max-width: 768px) {
            .lightbox-prev, .lightbox-next { display: none !important; }
            .lightbox-close { top: 16px !important; right: 16px !important; width: 42px !important; height: 42px !important; }
          }
        `;
        document.head.appendChild(styleTag);
      }

      const lightbox = document.createElement('div');
      lightbox.className = 'lightbox-overlay';
      lightbox.innerHTML = `
        <button class="lightbox-btn lightbox-close" title="Закрыть (Esc)">✕</button>
        <button class="lightbox-btn lightbox-prev" title="Назад (←)">←</button>
        <button class="lightbox-btn lightbox-next" title="Вперед (→)">→</button>
        <div class="lightbox-content">
          <img src="" alt="Fullscreen Render" class="lightbox-img">
          <div class="lightbox-caption"></div>
        </div>
      `;
      document.body.appendChild(lightbox);

      const lightboxImg = lightbox.querySelector('.lightbox-img');
      const lightboxCaption = lightbox.querySelector('.lightbox-caption');
      const closeBtn = lightbox.querySelector('.lightbox-close');
      const prevBtn = lightbox.querySelector('.lightbox-prev');
      const nextBtn = lightbox.querySelector('.lightbox-next');

      let currentIndex = 0;

      function showImage(index) {
        if (index < 0) index = galleryImages.length - 1;
        if (index >= galleryImages.length) index = 0;
        currentIndex = index;

        const targetImg = galleryImages[currentIndex];
        lightboxImg.src = targetImg.src;

        const parentFigure = targetImg.closest('figure');
        const caption = parentFigure ? parentFigure.querySelector('figcaption') : null;
        lightboxCaption.textContent = caption ? caption.textContent : targetImg.alt || '';
      }

      function openLightbox(index) {
        showImage(index);
        lightbox.classList.add('is-active');
        document.body.style.overflow = 'hidden';
      }

      function closeLightbox() {
        lightbox.classList.remove('is-active');
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

      document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('is-active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
        if (e.key === 'ArrowRight') showImage(currentIndex + 1);
      });
    }
  }
// ============================================================
  // ДИНАМИЧЕСКИЙ ФАВИКОН В СТИЛЕ YODEZEEN (F - E - R - R - O каждые 0.3s)
  // ============================================================
  const faviconLetters = ['F', 'E', 'R', 'R', 'O'];
  const favSize = 64; // Высокое разрешение для Retina/HiDPI вкладок
  const cachedFavicons = [];
  let currentFavIndex = 0;

  // Находим или создаём тег favicon в <head>
  let faviconLink = document.querySelector("link[rel*='icon']");
  if (!faviconLink) {
    faviconLink = document.createElement('link');
    faviconLink.rel = 'icon';
    document.head.appendChild(faviconLink);
  }

  function initDynamicFavicon() {
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

      // Чёрная буква шрифтом 1 ТИПА (Unbounded, Black 900)
      ctx.fillStyle = '#111111';
      ctx.font = '900 42px "Unbounded", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Оптическая центровка буквы по вертикали
      ctx.fillText(char, favSize / 2, favSize / 2 + 2);

      cachedFavicons.push(canvas.toDataURL('image/png'));
    });

    // 2. Функция ротации кадров
    function rotateFavicon() {
      if (cachedFavicons.length === 0) return;
      faviconLink.href = cachedFavicons[currentFavIndex];
      currentFavIndex = (currentFavIndex + 1) % cachedFavicons.length;
    }

    // Первый запуск и таймер ровно на 0.5 секунды (500 мс)
    rotateFavicon();
    setInterval(rotateFavicon, 500);
  }

  // Ожидаем загрузку шрифта Unbounded для кристально чёткой отрисовки букв
  if (document.fonts) {
    document.fonts.load('900 42px "Unbounded"').then(() => {
      initDynamicFavicon();
    }).catch(() => {
      initDynamicFavicon();
    });
  } else {
    setTimeout(initDynamicFavicon, 200);
  }

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

// 7. Автоматическая маска телефона (+7) при вводе номера в форме заявки
  const phoneInput = document.getElementById('userPhone') || document.querySelector('input[placeholder*="+7"]');

  if (phoneInput) {
    // При клике на пустое поле сразу подставляем +7 (
    phoneInput.addEventListener('focus', () => {
      if (!phoneInput.value.trim()) {
        phoneInput.value = '+7 (';
      }
    });

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

      // Если ввод начинается с @ или букв (ник Telegram), не мешаем
      if (/^[@a-zA-Z]/.test(val.trim())) return;

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
  }

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

// Список фотографий из папки COVER_MAIN для плавного переключения
      const candidateImages = [
        'images/COVER_MAIN/cover_main_makarovski.jpg',
        'images/COVER_MAIN/cover_main_nekrasova.jpg',
        'images/COVER_MAIN/cover_main_uralets.jpg'
      ];

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


  // 9. Выдвигающаяся надпись FERRO DESIGN в подвале при скролле от контактов
  const brandTitle = document.getElementById('footerBrandTitle');
  if (brandTitle) {
    let isTicking = false;

    function updateFooterBrandPosition() {
      const rect = brandTitle.getBoundingClientRect();
      const windowH = window.innerHeight;

      // Стартовая точка: когда заголовок подходит снизу после блока контактов
      const startPoint = windowH + 60;
      // Финишная точка: когда заголовок занял комфортное место в подвале
      const endPoint = windowH * 0.70;

      const rawProgress = (startPoint - rect.top) / (startPoint - endPoint);
      const progress = Math.max(0, Math.min(1, rawProgress));

      // Движение слева направо: от -180px до 0px (и обратно при скролле наверх)
      const currentTranslateX = (1 - progress) * -180;
      // Прозрачность: от 0 до 1 (и обратно в прозрачность при скролле наверх)
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

    // Инициализация при загрузке страницы
    updateFooterBrandPosition();
  }

  // 10. Плавающая навигация по помещениям в стиле Hot Walls (подсветка текущей зоны при скролле)
  const roomNav = document.getElementById('hwRoomNav');
  const roomHeaders = Array.from(document.querySelectorAll('.room-header[id]'));
  const roomLinks = Array.from(document.querySelectorAll('.hw-room-link'));

  if (roomNav && roomHeaders.length > 0 && projectBody) {
    function updateRoomNav() {
      const bodyRect = projectBody.getBoundingClientRect();
      const windowH = window.innerHeight;

      // Показываем капсулу только пока пользователь листает саму ленту рендеров (.project-body)
      const isInsideGallery = bodyRect.top < windowH * 0.65 && bodyRect.bottom > windowH * 0.35;
      roomNav.classList.toggle('is-visible', isInsideGallery);

      // Определяем активное помещение
      let currentRoomId = roomHeaders[0].id;
      roomHeaders.forEach(header => {
        const rect = header.getBoundingClientRect();
        if (rect.top <= windowH * 0.45) {
          currentRoomId = header.id;
        }
      });

      roomLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + currentRoomId);
      });
    }

    window.addEventListener('scroll', updateRoomNav, { passive: true });
    updateRoomNav();
  }
});