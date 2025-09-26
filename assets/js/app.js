'use strict';

(function () {
  const form = document.getElementById('multiPageForm');
  if (!form) return;

  const dateInput = document.getElementById('lunchDate');
  const pages = Array.from(document.querySelectorAll('.page'));
  const popup = document.getElementById('popup');
  const confetti = document.getElementById('confettiVideo');
  const surveyWeekHeading = document.getElementById('surveyWeek');

  let currentPage = 0;
  let isSubmitting = false;

  const clampRating = (value) => {
    const rating = Number(value);
    if (!Number.isFinite(rating)) return null;
    const clamped = Math.max(0, Math.min(5, rating));
    return Number.isFinite(clamped) ? clamped : null;
  };

  const cleanText = (value, maxLength = 1000) => {
    if (typeof value !== 'string') return '';
    return value
      .replace(/[<>]/g, '')
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .trim()
      .slice(0, maxLength);
  };

  const removeChildren = (node) => {
    while (node.firstChild) node.removeChild(node.firstChild);
  };

  const showPage = (index) => {
    pages.forEach((page, idx) => page.classList.toggle('active', idx === index));
    currentPage = index;

    const targetPage = pages[index];
    if (!targetPage) return;

    const firstInteractive = targetPage.querySelector('input, textarea, button');
    if (index === 0 && dateInput) {
      if (typeof dateInput.showPicker === 'function') {
        try { dateInput.showPicker(); } catch (_) { /* ignore */ }
      }
      dateInput.focus();
    } else if (firstInteractive) {
      firstInteractive.focus();
    }
  };

  const setWeekLabel = () => {
    if (!dateInput || !surveyWeekHeading) return;

    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek < 2 ? dayOfWeek + 5 : dayOfWeek - 2;
    const start = new Date(today.getTime());
    start.setDate(start.getDate() - diff);
    const end = new Date(start.getTime());
    end.setDate(end.getDate() + 2);

    const formatter = (dt) => dt.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
    dateInput.min = start.toISOString().slice(0, 10);
    dateInput.max = end.toISOString().slice(0, 10);
    surveyWeekHeading.textContent = `Campus Lunch Survey ${formatter(start)}–${formatter(end)}`;
  };

  const updateReuseDefaults = (reuseChecked) => {
    const hidden = document.getElementById('reuseDishwareOptInHidden');
    if (hidden) hidden.value = reuseChecked ? 'true' : 'false';

    if (!reuseChecked) {
      const defaults = [
        ['impactDishRatingInput', '0'],
        ['dishSatisfactionRatingInput', '0'],
        ['dishQualityRatingInput', '0'],
        ['dishConvenienceRatingInput', '0'],
        ['dishFutureRatingInput', '0'],
        ['dishChallenges', 'N/A']
      ];
      defaults.forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
      });
    }
  };

  const getPageIndex = (button) => {
    const page = button.closest('.page');
    return pages.indexOf(page);
  };

  const validatePageFields = (page) => {
    if (!page) return false;

    const hiddenInputs = page.querySelectorAll('input[type="hidden"]');
    for (const input of hiddenInputs) {
      if (!input.value) {
        window.alert(`Please select a rating for ${input.dataset.label}.`);
        return false;
      }
    }

    const visibleFields = page.querySelectorAll('input:not([type="hidden"]), textarea');
    for (const field of visibleFields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }

    return true;
  };

  const handleNext = (event) => {
    if (isSubmitting) return;

    const button = event.currentTarget;
    const pageIndex = getPageIndex(button);
    if (pageIndex === -1) return;

    const page = pages[pageIndex];
    if (!validatePageFields(page)) return;

    if (pageIndex === 1) {
      const reuseOptInEl = document.getElementById('reuseOptIn');
      const reuseChecked = Boolean(reuseOptInEl && reuseOptInEl.checked);
      updateReuseDefaults(reuseChecked);
      showPage(reuseChecked ? 2 : 3);
      return;
    }

    if (pageIndex < pages.length - 1) {
      showPage(pageIndex + 1);
    }
  };

  const handlePrev = (event) => {
    if (isSubmitting) return;

    const button = event.currentTarget;
    const pageIndex = getPageIndex(button);
    if (pageIndex === -1) return;

    if (pageIndex === 3) {
      const hidden = document.getElementById('reuseDishwareOptInHidden');
      if (hidden && hidden.value === 'false') {
        showPage(1);
        return;
      }
    }

    if (pageIndex > 0) {
      showPage(pageIndex - 1);
    }
  };

  const closePopup = () => {
    if (popup) popup.style.display = 'none';
    if (confetti) {
      confetti.pause();
      confetti.currentTime = 0;
      confetti.style.display = 'none';
    }
    form.reset();
    setWeekLabel();
    showPage(0);
  };

  const createRatingBar = (barId, icons, hiddenId) => {
    const container = document.getElementById(barId);
    const hidden = document.getElementById(hiddenId);
    if (!container || !hidden) return;

    removeChildren(container);
    container.setAttribute('role', 'radiogroup');
    container.setAttribute('aria-label', hidden.dataset.label);

    const buttons = [];

    const select = (index) => {
      buttons.forEach((btn, idx) => {
        btn.classList.toggle('selected', idx <= index);
        btn.setAttribute('aria-checked', idx === index ? 'true' : 'false');
        btn.tabIndex = idx === index ? 0 : -1;
      });
      hidden.value = String(index + 1);
    };

    icons.forEach((icon, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'emoji-container';
      button.setAttribute('aria-label', `${hidden.dataset.label} ${index + 1}`);
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', 'false');
      button.tabIndex = index === 0 ? 0 : -1;

      const image = document.createElement('img');
      image.src = `assets/${icon}`;
      image.alt = '';
      image.loading = 'lazy';

      const label = document.createElement('div');
      label.className = 'emoji-label';
      label.innerText = String(index + 1);

      button.addEventListener('click', () => select(index));
      button.addEventListener('keydown', (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
          select(index);
          event.preventDefault();
        }
        if (event.key === 'ArrowRight' && index < icons.length - 1) {
          buttons[index + 1].focus();
        }
        if (event.key === 'ArrowLeft' && index > 0) {
          buttons[index - 1].focus();
        }
      });

      button.append(image, label);
      container.append(button);
      buttons.push(button);
    });
  };

  document.querySelectorAll('[data-action="next-page"]').forEach((button) => {
    button.addEventListener('click', handleNext);
  });

  document.querySelectorAll('[data-action="prev-page"]').forEach((button) => {
    button.addEventListener('click', handlePrev);
  });

  document.querySelectorAll('[data-action="review-another"]').forEach((button) => {
    button.addEventListener('click', closePopup);
  });

  document.querySelectorAll('[data-action="close-tab"]').forEach((button) => {
    button.addEventListener('click', () => {
      closePopup();
      window.close();
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerText = 'Submitting…';
    }

    const optedIn = form.reuseDishwareOptInHidden?.value === 'true';

    const payload = {
      lunchDate: cleanText(form.lunchDate.value, 32),
      tasteRating: clampRating(form.tasteRating.value),
      temperatureRating: clampRating(form.temperatureRating.value),
      overallRating: clampRating(form.overallRating.value),
      flowersRating: clampRating(form.flowersRating.value),
      memorable: cleanText(form.memorable.value),
      expectations: cleanText(form.expectations.value),
      impactDishRating: optedIn ? clampRating(form.impactDishRating.value) : null,
      dishSatisfactionRating: optedIn ? clampRating(form.dishSatisfactionRating.value) : null,
      dishQualityRating: optedIn ? clampRating(form.dishQualityRating.value) : null,
      dishConvenienceRating: optedIn ? clampRating(form.dishConvenienceRating.value) : null,
      dishFutureRating: optedIn ? clampRating(form.dishFutureRating.value) : null,
      dishChallenges: optedIn ? cleanText(form.dishChallenges.value) : null,
      reuseDishwareOptIn: optedIn
    };

    try {
      const response = await fetch('/.netlify/functions/submit-to-smartsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin'
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      if (popup) popup.style.display = 'block';
      if (confetti) {
        confetti.style.display = 'block';
        confetti.play().catch(() => {});
      }
    } catch (error) {
      console.error(error);
      window.alert(error.message);
    } finally {
      isSubmitting = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerText = 'Submit';
      }
    }
  });

  setWeekLabel();
  createRatingBar('tasteRating', ['hotdog.png', 'hotdog.png', 'hotdog.png', 'hotdog.png', 'hotdog.png'], 'tasteRatingInput');
  createRatingBar('temperatureRating', ['cold.png', 'cold.png', 'scale1.png', 'fire.png', 'fire.png'], 'temperatureRatingInput');
  createRatingBar('overallRating', ['frown2.png', 'frown1.png', 'neutral.png', 'smile1.png', 'smile2.png'], 'overallRatingInput');
  createRatingBar('flowersRating', ['flowers1.png', 'flowers2.png', 'flowers3.png', 'flowers4.png', 'flower.png'], 'flowersRatingInput');
  createRatingBar('impactDishRating', ['placeholder-impact.png', 'placeholder-impact.png', 'placeholder-impact.png', 'placeholder-impact.png', 'placeholder-impact.png'], 'impactDishRatingInput');
  createRatingBar('dishSatisfactionRating', ['frown2.png', 'frown1.png', 'neutral.png', 'smile1.png', 'smile2.png'], 'dishSatisfactionRatingInput');
  createRatingBar('dishQualityRating', ['placeholder-quality.png', 'placeholder-quality.png', 'placeholder-quality.png', 'placeholder-quality.png', 'placeholder-quality.png'], 'dishQualityRatingInput');
  createRatingBar('dishConvenienceRating', ['placeholder-convenience.png', 'placeholder-convenience.png', 'placeholder-convenience.png', 'placeholder-convenience.png', 'placeholder-convenience.png'], 'dishConvenienceRatingInput');
  createRatingBar('dishFutureRating', ['placeholder-future.png', 'placeholder-future.png', 'placeholder-future.png', 'placeholder-future.png', 'placeholder-future.png'], 'dishFutureRatingInput');

  showPage(0);
})();
