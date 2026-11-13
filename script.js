(() => {
  const intro = document.getElementById('introOverlay');
  const introVideo = document.getElementById('introVideo');
  const skipButton = document.getElementById('skipIntro');
  const progress = document.getElementById('introProgress');
  const params = new URLSearchParams(window.location.search);
  const forceIntro = params.has('intro');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let introClosed = false;

  const closeIntro = () => {
    if (!intro || introClosed) return;
    introClosed = true;
    try { sessionStorage.setItem('jivIntroSeen', '1'); } catch (e) {}
    document.body.classList.remove('intro-active');
    intro.classList.add('is-hidden');
    if (introVideo) introVideo.pause();
  };

  if (intro) {
    let alreadySeen = false;
    try { alreadySeen = !!sessionStorage.getItem('jivIntroSeen'); } catch (e) {}
    const shouldPlayIntro = forceIntro || (!alreadySeen && !reducedMotion);

    if (shouldPlayIntro) {
      document.body.classList.add('intro-active');
      if (introVideo) {
        introVideo.muted = true;
        introVideo.currentTime = 0;
        introVideo.play().catch(() => {
          // Autoplay can be blocked by a browser; the visitor can still enter with the skip button.
          if (skipButton) skipButton.innerHTML = 'Entrer sur le site <span aria-hidden="true">↗</span>';
        });
        introVideo.addEventListener('timeupdate', () => {
          if (!progress || !introVideo.duration) return;
          progress.style.width = `${Math.min(100, (introVideo.currentTime / introVideo.duration) * 100)}%`;
        });
        introVideo.addEventListener('ended', closeIntro, { once: true });
      }
    } else {
      closeIntro();
    }

    skipButton?.addEventListener('click', closeIntro);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !introClosed) closeIntro();
    });
  }

  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');
  menuToggle?.addEventListener('click', () => {
    const open = nav?.classList.toggle('open') ?? false;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  });
  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuToggle?.setAttribute('aria-expanded', 'false');
      menuToggle?.setAttribute('aria-label', 'Ouvrir le menu');
    });
  });

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const servicePicker = document.getElementById('servicePicker');
  const serviceTrigger = document.getElementById('servicePickerTrigger');
  const serviceMenu = document.getElementById('servicePickerMenu');
  const serviceValue = document.getElementById('contactType');
  const serviceText = document.getElementById('servicePickerText');
  const serviceError = document.getElementById('serviceError');
  const serviceOptions = serviceMenu ? Array.from(serviceMenu.querySelectorAll('.service-option')) : [];

  const closeServiceMenu = (returnFocus = false) => {
    if (!servicePicker || !serviceMenu || !serviceTrigger) return;
    serviceMenu.hidden = true;
    servicePicker.classList.remove('open');
    serviceTrigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) serviceTrigger.focus();
  };
  const openServiceMenu = () => {
    if (!servicePicker || !serviceMenu || !serviceTrigger) return;
    serviceMenu.hidden = false;
    servicePicker.classList.add('open');
    serviceTrigger.setAttribute('aria-expanded', 'true');
    const current = serviceOptions.find((option) => option.dataset.value === serviceValue?.value);
    (current || serviceOptions[0])?.focus();
  };
  const chooseService = (option) => {
    if (!serviceValue || !serviceText || !servicePicker) return;
    serviceValue.value = option.dataset.value || '';
    serviceText.textContent = option.dataset.value || 'Choisir un service';
    const triggerDot = serviceTrigger?.querySelector('.service-dot');
    if (triggerDot) triggerDot.className = `service-dot ${option.dataset.color || ''}`.trim();
    serviceOptions.forEach((item) => item.setAttribute('aria-selected', String(item === option)));
    servicePicker.classList.remove('invalid');
    if (serviceError) serviceError.textContent = '';
    closeServiceMenu(true);
  };

  serviceTrigger?.addEventListener('click', () => {
    if (serviceMenu?.hidden) openServiceMenu();
    else closeServiceMenu();
  });
  serviceTrigger?.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      openServiceMenu();
    }
  });
  serviceOptions.forEach((option, index) => {
    option.addEventListener('click', () => chooseService(option));
    option.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeServiceMenu(true);
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const next = (index + (event.key === 'ArrowDown' ? 1 : -1) + serviceOptions.length) % serviceOptions.length;
        serviceOptions[next].focus();
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        serviceOptions[event.key === 'Home' ? 0 : serviceOptions.length - 1].focus();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        chooseService(option);
      }
    });
  });
  document.addEventListener('click', (event) => {
    if (servicePicker && !servicePicker.contains(event.target)) closeServiceMenu();
  });

  const contactForm = document.getElementById('contactForm');
  contactForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('contactName')?.value.trim() || '';
    const email = document.getElementById('contactEmail')?.value.trim() || '';
    const type = document.getElementById('contactType')?.value || '';
    const brief = document.getElementById('contactBrief')?.value.trim() || '';
    if (!type) {
      servicePicker?.classList.add('invalid');
      if (serviceError) serviceError.textContent = 'Choisissez un service pour continuer.';
      serviceTrigger?.focus();
      return;
    }
    const message = [
      'Bonjour JIV Digital,',
      `Je m'appelle ${name}.`,
      type ? `Je souhaite parler de : ${type}.` : '',
      email ? `Mon e-mail : ${email}.` : '',
      brief ? `Mon idée : ${brief}` : '',
    ].filter(Boolean).join('\n');
    const url = `https://wa.me/2250170866293?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }
})();
