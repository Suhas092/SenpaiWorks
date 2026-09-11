/* ==========================================================================
   Course Details Page — Dynamic API Controller
   Fetches course data from /api/courses/:slug
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // 0. Ensure LEARN nav link is highlighted as active when inside course-detail
  function activateLearnNavLink() {
    const navLinks = document.querySelectorAll('.header-nav .nav-link, .mobile-nav-item');
    navLinks.forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      if (href.includes('learn')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
  activateLearnNavLink();
  setTimeout(activateLearnNavLink, 150);
  setTimeout(activateLearnNavLink, 500);

  // 1. Read 'id' from URL query string (slug or UUID)
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id') || 'zbrush';

  // Show loading state
  const titleEl = document.getElementById('course-title');
  if (titleEl) titleEl.textContent = 'Loading...';

  // 2. Fetch course from API
  fetch(`/api/courses/${encodeURIComponent(courseId)}`)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(course => populatePage(course))
    .catch(err => {
      console.error('[CourseDetail] Failed to load course:', err);
      if (titleEl) titleEl.textContent = 'Course Not Found';
      const subtitle = document.getElementById('course-subtitle');
      if (subtitle) subtitle.textContent = 'Sorry, this course could not be loaded. Please go back to the Learn page.';
    });

  // 3. Populate all DOM elements with course data
  function populatePage(course) {
    document.title = `${course.title} - SenpaiWorks`;

    // Breadcrumb
    const breadcrumbCatEl = document.getElementById('breadcrumb-category');
    if (breadcrumbCatEl) breadcrumbCatEl.textContent = course.tag || '3D Sculpting';

    // Hero
    if (titleEl) titleEl.textContent = course.title;

    const subtitleEl = document.getElementById('course-subtitle');
    if (subtitleEl) subtitleEl.textContent = course.subtitle || course.description || '';

    const badgeEl = document.getElementById('course-badge');
    if (badgeEl) {
      if (course.badge) {
        badgeEl.textContent = course.badge;
        badgeEl.style.display = '';
      } else {
        badgeEl.style.display = 'none';
      }
    }

    const instructorEl = document.getElementById('course-instructor');
    if (instructorEl) instructorEl.textContent = course.authorName || 'SenpaiWorks Studio';

    const updatedEl = document.getElementById('course-updated');
    if (updatedEl) updatedEl.textContent = course.releaseDate || '2026';

    const ratingEl = document.getElementById('course-rating');
    if (ratingEl) ratingEl.textContent = course.rating || '4.9';

    const ratingCountEl = document.getElementById('course-rating-count');
    if (ratingCountEl) ratingCountEl.textContent = course.ratingCount || '';

    const learnersEl = document.getElementById('course-learners');
    if (learnersEl) learnersEl.textContent = course.learnersCount || '0';

    // Sidebar thumbnail
    const sidebarThumb = document.getElementById('sidebar-thumb');
    if (sidebarThumb && course.thumbnail) sidebarThumb.src = course.thumbnail;

    // Pricing
    const priceEl = document.getElementById('course-price');
    if (priceEl) priceEl.textContent = course.price || '';

    const originalPriceEl = document.getElementById('course-original-price');
    if (originalPriceEl) originalPriceEl.textContent = course.originalPrice || '';

    const discountEl = document.getElementById('course-discount');
    if (discountEl) discountEl.textContent = course.discount || '';

    const subPriceEl = document.querySelector('.price-monthly');
    if (subPriceEl && course.monthlyPrice) subPriceEl.textContent = course.monthlyPrice;

    const subStrikePriceEl = document.querySelector('.price-strike');
    if (subStrikePriceEl && course.originalMonthlyPrice) subStrikePriceEl.textContent = course.originalMonthlyPrice;

    // Course includes duration / resources
    const incDuration = document.getElementById('inc-duration');
    if (incDuration && course.duration) incDuration.textContent = course.duration;

    const incResources = document.getElementById('inc-resources');
    if (incResources && course.resources) incResources.textContent = course.resources;

    // 4. "What You'll Learn" Grid
    const learnGridEl = document.getElementById('what-you-will-learn');
    const learnItems = Array.isArray(course.whatYouWillLearn) ? course.whatYouWillLearn : [];
    if (learnGridEl) {
      learnGridEl.innerHTML = learnItems.length
        ? learnItems.map(item => `
            <div class="learn-item">
              <i class="fa-solid fa-check"></i>
              <span>${escapeHtml(item)}</span>
            </div>
          `).join('')
        : '';
    }

    // 5. Related Topics Tags
    const topicsEl = document.getElementById('related-topics');
    const topicsList = Array.isArray(course.relatedTopics) ? course.relatedTopics : [];
    if (topicsEl) {
      topicsEl.innerHTML = topicsList.map(topic => `<span class="topic-pill">${escapeHtml(topic)}</span>`).join('');
    }

    // 6. Requirements
    const reqListEl = document.getElementById('course-requirements');
    const reqItems = Array.isArray(course.requirements) ? course.requirements : [];
    if (reqListEl) {
      reqListEl.innerHTML = reqItems.map(req => `<li>${escapeHtml(req)}</li>`).join('');
    }

    // 7. Curriculum accordion
    const curriculum = Array.isArray(course.curriculum) ? course.curriculum : [];
    let totalLectures = 0;
    curriculum.forEach(sec => { totalLectures += (sec.lectures || []).length; });

    const contentMetaEl = document.getElementById('content-meta-summary');
    if (contentMetaEl) {
      contentMetaEl.textContent = `${curriculum.length} sections • ${totalLectures} lectures • ${course.duration || ''}`;
    }

    const accordionContainer = document.getElementById('curriculum-accordion');
    if (accordionContainer) {
      accordionContainer.innerHTML = curriculum.map((section, idx) => `
        <div class="accordion-item ${idx === 0 ? 'active' : ''}">
          <div class="accordion-header">
            <div class="accordion-title-wrap">
              <i class="fa-solid fa-chevron-down accordion-icon"></i>
              <span>${escapeHtml(section.sectionTitle || '')}</span>
            </div>
            <span class="accordion-meta-info">${escapeHtml(section.metaSummary || '')}</span>
          </div>
          <div class="accordion-content">
            ${(section.lectures || []).map(lec => `
              <div class="lecture-row">
                <div class="lecture-left">
                  <i class="fa-solid fa-circle-play"></i>
                  <span>${escapeHtml(lec.name || '')}</span>
                  ${lec.isPreview ? `<span class="preview-btn-text" data-video="${course.videoUrl || ''}">${'Preview'}</span>` : ''}
                </div>
                <span class="lecture-duration">${escapeHtml(lec.duration || '')}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');

      // Accordion toggle
      accordionContainer.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
          header.parentElement.classList.toggle('active');
        });
      });
    }

    // 8. Instructor section (update name if changed)
    const instructorNameEl = document.getElementById('instructor-name');
    if (instructorNameEl) instructorNameEl.textContent = course.authorName || 'SenpaiWorks Studio';

    // 9. Pricing radio selection
    const subOption = document.getElementById('sub-option');
    const oneTimeOption = document.getElementById('one-time-option');
    const radioSub = document.getElementById('radio-sub');
    const radioOnce = document.getElementById('radio-once');
    const ctaBtn = document.getElementById('cta-action-btn');

    if (subOption && oneTimeOption) {
      subOption.addEventListener('click', () => {
        radioSub.checked = true;
        subOption.classList.add('active');
        oneTimeOption.classList.remove('active');
        if (ctaBtn) ctaBtn.querySelector('span').textContent = 'Start Subscription';
      });

      oneTimeOption.addEventListener('click', () => {
        radioOnce.checked = true;
        oneTimeOption.classList.add('active');
        subOption.classList.remove('active');
        if (ctaBtn) ctaBtn.querySelector('span').textContent = `Enroll Now - ${course.price || ''}`;
      });
    }

    // 10. Coupon Code Handling — validates server-side, never trusts client price
    const couponInput = document.getElementById('coupon-input');
    const applyCouponBtn = document.getElementById('apply-coupon-btn');
    const couponMsg = document.getElementById('coupon-status-msg');

    if (applyCouponBtn && couponInput) {
      applyCouponBtn.addEventListener('click', async () => {
        const code = couponInput.value.trim();
        if (!code) {
          couponMsg.className = 'coupon-status-msg error';
          couponMsg.textContent = 'Please enter a coupon code.';
          return;
        }

        applyCouponBtn.disabled = true;
        applyCouponBtn.textContent = 'Checking...';
        couponMsg.className = 'coupon-status-msg';
        couponMsg.textContent = '';

        try {
          const r = await fetch('/api/coupons/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, courseId })
          });
          const data = await r.json();

          if (!r.ok || !data.success) {
            couponMsg.className = 'coupon-status-msg error';
            couponMsg.textContent = data.error || 'Invalid coupon code.';
          } else {
            couponMsg.className = 'coupon-status-msg success';
            couponMsg.textContent = data.message || 'Coupon applied!';

            // Update price display with server-computed values
            if (data.finalPriceFormatted && priceEl) {
              priceEl.textContent = data.finalPriceFormatted;
            }
            if (data.originalPrice !== null && originalPriceEl) {
              originalPriceEl.textContent = course.price; // show original as strikethrough
            }
            if (discountEl && data.discountDisplay) {
              discountEl.textContent = data.discountDisplay;
            }

            // Disable re-apply once applied
            applyCouponBtn.disabled = true;
            couponInput.disabled = true;
          }
        } catch (err) {
          couponMsg.className = 'coupon-status-msg error';
          couponMsg.textContent = 'Network error. Please try again.';
        } finally {
          if (!couponInput.disabled) {
            applyCouponBtn.disabled = false;
            applyCouponBtn.textContent = 'Apply';
          }
        }
      });
    }

    // 11. Video Preview Modal
    const videoModal = document.getElementById('video-modal');
    const modalIframe = document.getElementById('modal-iframe');
    const previewMediaBox = document.getElementById('preview-media-box');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalTitle = document.getElementById('modal-title');

    function openVideoModal(videoSrc, title) {
      if (videoModal && modalIframe) {
        modalIframe.src = videoSrc;
        if (modalTitle && title) modalTitle.textContent = title;
        videoModal.style.display = 'flex';
      }
    }

    function closeVideoModal() {
      if (videoModal && modalIframe) {
        videoModal.style.display = 'none';
        modalIframe.src = '';
      }
    }

    if (previewMediaBox) {
      previewMediaBox.addEventListener('click', () => {
        openVideoModal(course.videoUrl || '', `Preview: ${course.title}`);
      });
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeVideoModal);

    if (videoModal) {
      videoModal.addEventListener('click', e => {
        if (e.target === videoModal) closeVideoModal();
      });
    }

    // Delegate preview clicks from lecture rows
    document.addEventListener('click', e => {
      if (e.target.classList.contains('preview-btn-text')) {
        const videoSrc = e.target.getAttribute('data-video') || course.videoUrl || '';
        const lectureSpan = e.target.closest('.lecture-left')?.querySelector('span');
        const lectureName = lectureSpan ? lectureSpan.textContent : 'Lecture';
        openVideoModal(videoSrc, `Lecture Preview: ${lectureName}`);
      }
    });
  }

  // Simple HTML escaper
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

});
