/**
 * SenpaiWorks - Dedicated Full-Page Course Editor Controller
 * scripts/admin/admin-course-editor.js
 */

(function () {
  let isRawJsonMode = false;
  let curriculumState = [];

  // ── Initialize on DOM ready ──────────────────────────────
  document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');

    setupEventListeners();

    if (courseId) {
      await loadCourseForEditing(courseId);
    } else {
      setupNewCourseDefaults();
    }
  });

  // ── Event Listeners Setup ─────────────────────────────────
  function setupEventListeners() {
    // Live update for "What you'll learn" item count
    const learnInput = document.getElementById('field-learn');
    if (learnInput) {
      learnInput.addEventListener('input', () => {
        const count = learnInput.value.split('\n').filter(s => s.trim().length > 0).length;
        const pill = document.getElementById('learn-count-pill');
        if (pill) pill.textContent = `${count} item${count !== 1 ? 's' : ''}`;
      });
    }

    // Live update for slug and preview link
    const slugInput = document.getElementById('field-slug');
    if (slugInput) {
      slugInput.addEventListener('input', () => {
        const slug = slugInput.value.trim().toLowerCase();
        const previewBtn = document.getElementById('btn-public-preview');
        if (previewBtn) {
          previewBtn.href = `course-detail.html?id=${encodeURIComponent(slug || 'zbrush')}`;
        }
      });
    }

    // Live raw curriculum JSON input listener
    const rawCurriculumInput = document.getElementById('field-curriculum-raw');
    if (rawCurriculumInput) {
      rawCurriculumInput.addEventListener('input', () => {
        try {
          const parsed = JSON.parse(rawCurriculumInput.value);
          if (Array.isArray(parsed)) {
            curriculumState = parsed;
            updateCurriculumBadge(curriculumState);
          }
        } catch (e) {
          // Invalid JSON while typing; ignore until valid
        }
      });
    }

    // Ctrl+S / Cmd+S Keyboard Shortcut to Save
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        window.saveCourseDetails();
      }
    });
  }

  // ── Load Course Data from API ────────────────────────────
  async function loadCourseForEditing(idOrSlug) {
    const headingTitle = document.getElementById('page-title-text');
    const subtitleText = document.getElementById('page-subtitle-text');
    if (headingTitle) headingTitle.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Loading Course Details...`;

    try {
      // First try single public/cached endpoint
      let course = null;
      const res = await fetch(`/api/courses/${encodeURIComponent(idOrSlug)}`);
      if (res.ok) {
        course = await res.json();
      } else {
        // Fallback to admin courses list in case it's unpublished
        const adminRes = await fetch('/api/admin/courses');
        if (adminRes.ok) {
          const allCourses = await adminRes.json();
          course = allCourses.find(c => c.id === idOrSlug || c.slug === idOrSlug);
        }
      }

      if (!course) throw new Error('Course not found');

      // Populate Form Fields
      document.getElementById('edit-course-id').value = course.id || '';
      document.getElementById('field-title').value = course.title || '';
      document.getElementById('field-slug').value = course.slug || '';
      document.getElementById('field-subtitle').value = course.subtitle || '';
      document.getElementById('field-tag').value = course.tag || '';
      document.getElementById('field-status').value = course.status || 'In Planning';
      document.getElementById('field-badge').value = course.badge || '';
      document.getElementById('field-description').value = course.description || '';

      // What you'll learn
      const learnList = Array.isArray(course.whatYouWillLearn) ? course.whatYouWillLearn : [];
      document.getElementById('field-learn').value = learnList.join('\n');
      const learnPill = document.getElementById('learn-count-pill');
      if (learnPill) learnPill.textContent = `${learnList.length} items`;

      // Requirements & Topics
      const reqList = Array.isArray(course.requirements) ? course.requirements : [];
      document.getElementById('field-requirements').value = reqList.join('\n');

      const topicsList = Array.isArray(course.relatedTopics) ? course.relatedTopics : [];
      document.getElementById('field-topics').value = topicsList.join(', ');

      // Sidebar Fields
      document.getElementById('field-published').value = course.published ? 'true' : 'false';
      document.getElementById('field-order').value = course.order !== undefined ? course.order : 1;
      document.getElementById('field-release').value = course.releaseDate || '';
      document.getElementById('field-price').value = course.price || '';
      document.getElementById('field-originalPrice').value = course.originalPrice || '';
      document.getElementById('field-discount').value = course.discount || '';
      document.getElementById('field-monthlyPrice').value = course.monthlyPrice || '';
      document.getElementById('field-thumbnail').value = course.thumbnail || '';
      document.getElementById('field-videoUrl').value = course.videoUrl || '';
      document.getElementById('field-author').value = course.authorName || 'SenpaiWorks Studio';
      document.getElementById('field-rating').value = course.rating || '4.9';
      document.getElementById('field-ratingCount').value = course.ratingCount || '(1,004 ratings)';
      document.getElementById('field-learnersCount').value = course.learnersCount || '5,892';

      // Curriculum
      curriculumState = Array.isArray(course.curriculum) ? course.curriculum : [];
      renderVisualCurriculum();
      syncCurriculumToRaw();

      // Media & Page Titles
      window.updateMediaPreview();
      const previewBtn = document.getElementById('btn-public-preview');
      if (previewBtn) previewBtn.href = `course-detail.html?id=${encodeURIComponent(course.slug || course.id)}`;

      if (headingTitle) headingTitle.textContent = `Editing: ${course.title}`;
      if (subtitleText) subtitleText.textContent = `ID: ${course.id} • Slug: ${course.slug || 'none'}`;
      document.title = `Edit: ${course.title} - SenpaiWorks Admin`;

    } catch (err) {
      console.error('Failed to load course:', err);
      if (headingTitle) headingTitle.innerHTML = `<span style="color:#ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Course Not Found</span>`;
      if (subtitleText) subtitleText.textContent = `Could not load course with identifier: ${idOrSlug}`;
      if (window.showAdminToast) window.showAdminToast('Could not load course.', 'danger');
    }
  }

  // ── New Course Defaults ──────────────────────────────────
  function setupNewCourseDefaults() {
    const headingTitle = document.getElementById('page-title-text');
    const subtitleText = document.getElementById('page-subtitle-text');
    if (headingTitle) headingTitle.textContent = 'Create New Masterclass';
    if (subtitleText) subtitleText.textContent = 'Configure course content, lessons, pricing, and SEO details.';

    document.getElementById('field-tag').value = '3D Digital Sculpting';
    document.getElementById('field-status').value = 'In Planning';
    document.getElementById('field-badge').value = 'New Masterclass';
    document.getElementById('field-price').value = '₹489.00';
    document.getElementById('field-originalPrice').value = '₹3,199.00';
    document.getElementById('field-discount').value = '84% off';
    document.getElementById('field-monthlyPrice').value = '₹375.00';
    document.getElementById('field-videoUrl').value = 'https://www.youtube.com/embed/SsoV6Mdjr6A';
    document.getElementById('field-author').value = 'SenpaiWorks Studio';
    document.getElementById('field-release').value = 'Release 2026';
    document.getElementById('field-rating').value = '4.9';
    document.getElementById('field-ratingCount').value = '(0 ratings)';
    document.getElementById('field-learnersCount').value = '0';

    curriculumState = [
      {
        sectionTitle: "Section 1: Course Introduction & Fundamentals",
        metaSummary: "2 lectures • 45m",
        lectures: [
          { name: "01. Workspace Overview & Tool Setup", duration: "15:00", isPreview: true },
          { name: "02. Core Anatomical Blockout Techniques", duration: "30:00", isPreview: false }
        ]
      }
    ];

    renderVisualCurriculum();
    syncCurriculumToRaw();
    window.updateMediaPreview();
  }

  // ── Visual Curriculum Builder ─────────────────────────────
  function renderVisualCurriculum() {
    const wrapper = document.getElementById('sections-wrapper');
    if (!wrapper) return;

    if (!curriculumState || curriculumState.length === 0) {
      wrapper.innerHTML = `<div style="text-align:center; padding:32px; color:#64748b; background:#0b0f19; border-radius:12px; border:1px dashed rgba(255,255,255,0.08); margin-bottom:16px;">
        <i class="fa-solid fa-folder-open" style="font-size:24px; margin-bottom:8px; display:block;"></i>
        No curriculum sections yet. Click "+ Add New Section" below to create one!
      </div>`;
      updateCurriculumBadge([]);
      return;
    }

    wrapper.innerHTML = curriculumState.map((sec, secIdx) => {
      const lectures = Array.isArray(sec.lectures) ? sec.lectures : [];
      return `
        <div class="section-card" data-section-index="${secIdx}">
          <div class="section-card-header">
            <span class="section-card-badge">Section ${secIdx + 1}</span>
            <input type="text" class="form-input section-title-input" value="${window.escapeHtml(sec.sectionTitle || '')}" placeholder="Section Title..." oninput="window.updateSectionTitle(${secIdx}, this.value)">
            <input type="text" class="form-input" style="width:170px;" value="${window.escapeHtml(sec.metaSummary || '')}" placeholder="e.g. 3 lectures • 1h 45m" oninput="window.updateSectionMeta(${secIdx}, this.value)">
            <button type="button" class="btn-remove-section" onclick="window.removeVisualSection(${secIdx})" title="Delete Section">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>

          <div class="lectures-list">
            ${lectures.map((lec, lecIdx) => `
              <div class="lecture-row">
                <input type="text" class="form-input" style="padding:6px 10px; font-size:13px;" value="${window.escapeHtml(lec.name || '')}" placeholder="Lecture Title..." oninput="window.updateLectureName(${secIdx}, ${lecIdx}, this.value)">
                <input type="text" class="form-input" style="padding:6px 10px; font-size:12px;" value="${window.escapeHtml(lec.duration || '')}" placeholder="Duration (12:15)" oninput="window.updateLectureDuration(${secIdx}, ${lecIdx}, this.value)">
                <label class="lecture-preview-check">
                  <input type="checkbox" ${lec.isPreview ? 'checked' : ''} onchange="window.updateLecturePreview(${secIdx}, ${lecIdx}, this.checked)">
                  <span>Preview</span>
                </label>
                <button type="button" class="btn-remove-lecture" onclick="window.removeVisualLecture(${secIdx}, ${lecIdx})" title="Remove Lecture">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            `).join('')}

            <button type="button" class="btn-add-lecture" onclick="window.addVisualLecture(${secIdx})">
              <i class="fa-solid fa-plus"></i> Add Lecture to Section ${secIdx + 1}
            </button>
          </div>
        </div>
      `;
    }).join('');

    updateCurriculumBadge(curriculumState);
  }

  function updateCurriculumBadge(sections) {
    const badge = document.getElementById('curriculum-counter-badge');
    if (!badge) return;

    let lectureCount = 0;
    (sections || []).forEach(s => {
      if (Array.isArray(s.lectures)) lectureCount += s.lectures.length;
    });
    badge.textContent = `${sections.length} section${sections.length !== 1 ? 's' : ''} • ${lectureCount} lecture${lectureCount !== 1 ? 's' : ''}`;
  }

  function syncCurriculumToRaw() {
    const rawInput = document.getElementById('field-curriculum-raw');
    if (rawInput) {
      rawInput.value = JSON.stringify(curriculumState, null, 2);
    }
  }

  // ── Curriculum Action Handlers (Attached to window) ───────
  window.addVisualSection = function () {
    const newSecIndex = curriculumState.length + 1;
    curriculumState.push({
      sectionTitle: `Section ${newSecIndex}: New Topic / Module`,
      metaSummary: "2 lectures • 45m",
      lectures: [
        { name: `01. Lecture Intro`, duration: "15:00", isPreview: true },
        { name: `02. Hands-on Workflow`, duration: "30:00", isPreview: false }
      ]
    });
    renderVisualCurriculum();
    syncCurriculumToRaw();
    if (window.showAdminToast) window.showAdminToast(`Section ${newSecIndex} added`, 'info');
  };

  window.removeVisualSection = function (secIdx) {
    if (!confirm(`Delete Section ${secIdx + 1}? All lectures within it will be removed.`)) return;
    curriculumState.splice(secIdx, 1);
    renderVisualCurriculum();
    syncCurriculumToRaw();
  };

  window.addVisualLecture = function (secIdx) {
    if (!curriculumState[secIdx]) return;
    if (!Array.isArray(curriculumState[secIdx].lectures)) curriculumState[secIdx].lectures = [];

    const lecNumber = curriculumState[secIdx].lectures.length + 1;
    const prefix = lecNumber < 10 ? `0${lecNumber}` : `${lecNumber}`;

    curriculumState[secIdx].lectures.push({
      name: `${prefix}. New Lecture Title`,
      duration: "25:00",
      isPreview: false
    });
    renderVisualCurriculum();
    syncCurriculumToRaw();
  };

  window.removeVisualLecture = function (secIdx, lecIdx) {
    if (!curriculumState[secIdx] || !curriculumState[secIdx].lectures) return;
    curriculumState[secIdx].lectures.splice(lecIdx, 1);
    renderVisualCurriculum();
    syncCurriculumToRaw();
  };

  window.updateSectionTitle = function (secIdx, val) {
    if (curriculumState[secIdx]) {
      curriculumState[secIdx].sectionTitle = val;
      syncCurriculumToRaw();
    }
  };

  window.updateSectionMeta = function (secIdx, val) {
    if (curriculumState[secIdx]) {
      curriculumState[secIdx].metaSummary = val;
      syncCurriculumToRaw();
    }
  };

  window.updateLectureName = function (secIdx, lecIdx, val) {
    if (curriculumState[secIdx] && curriculumState[secIdx].lectures[lecIdx]) {
      curriculumState[secIdx].lectures[lecIdx].name = val;
      syncCurriculumToRaw();
    }
  };

  window.updateLectureDuration = function (secIdx, lecIdx, val) {
    if (curriculumState[secIdx] && curriculumState[secIdx].lectures[lecIdx]) {
      curriculumState[secIdx].lectures[lecIdx].duration = val;
      syncCurriculumToRaw();
    }
  };

  window.updateLecturePreview = function (secIdx, lecIdx, isChecked) {
    if (curriculumState[secIdx] && curriculumState[secIdx].lectures[lecIdx]) {
      curriculumState[secIdx].lectures[lecIdx].isPreview = isChecked;
      syncCurriculumToRaw();
    }
  };

  // ── Toggle Raw JSON Mode ──────────────────────────────────
  window.toggleCurriculumMode = function () {
    const visual = document.getElementById('curriculum-visual-container');
    const raw = document.getElementById('curriculum-raw-container');
    const label = document.getElementById('json-toggle-label');

    isRawJsonMode = !isRawJsonMode;
    if (isRawJsonMode) {
      syncCurriculumToRaw();
      visual.style.display = 'none';
      raw.style.display = 'block';
      if (label) label.textContent = 'Visual Builder';
    } else {
      // Parse back from raw into visual
      const rawText = document.getElementById('field-curriculum-raw').value.trim();
      try {
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed)) {
            curriculumState = parsed;
          }
        }
      } catch (e) {
        alert('Invalid JSON syntax. Please correct it before switching to visual builder.');
        isRawJsonMode = true;
        return;
      }
      renderVisualCurriculum();
      visual.style.display = 'block';
      raw.style.display = 'none';
      if (label) label.textContent = 'Raw JSON';
    }
  };

  window.prettifyCurriculumJson = function () {
    const rawInput = document.getElementById('field-curriculum-raw');
    if (!rawInput) return;
    try {
      const parsed = JSON.parse(rawInput.value.trim() || '[]');
      rawInput.value = JSON.stringify(parsed, null, 2);
      if (window.showAdminToast) window.showAdminToast('JSON formatted successfully', 'success');
    } catch (e) {
      alert('JSON Syntax Error: ' + e.message);
    }
  };

  // ── Thumbnail Live Preview ────────────────────────────────
  window.updateMediaPreview = function () {
    const url = document.getElementById('field-thumbnail')?.value?.trim();
    const box = document.getElementById('thumb-preview-box');
    if (!box) return;

    if (url) {
      box.innerHTML = `<img src="${window.escapeHtml(url)}" alt="Thumbnail Preview" onerror="this.parentElement.innerHTML='<span style=\'color:#f87171;font-size:12px;\'>Failed to load image</span>';">`;
    } else {
      box.innerHTML = `<span style="color:#64748b; font-size:12px;">No image preview</span>`;
    }
  };

  // ── Save Course Details ───────────────────────────────────
  window.saveCourseDetails = async function () {
    const saveBtn = document.getElementById('btn-save-course');
    const courseId = document.getElementById('edit-course-id').value;
    const isEdit = !!courseId;

    // Make sure curriculum is up to date
    if (isRawJsonMode) {
      const rawText = document.getElementById('field-curriculum-raw').value.trim();
      try {
        if (rawText) curriculumState = JSON.parse(rawText);
      } catch (err) {
        alert('Curriculum JSON error: ' + err.message);
        return;
      }
    }

    const title = document.getElementById('field-title').value.trim();
    if (!title) {
      alert('Course Title is required.');
      document.getElementById('field-title').focus();
      return;
    }

    const slug = document.getElementById('field-slug').value.trim().toLowerCase() ||
                 title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Parse bullets
    const whatYouWillLearn = document.getElementById('field-learn').value
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const requirements = document.getElementById('field-requirements').value
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const relatedTopics = document.getElementById('field-topics').value
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      title,
      slug,
      subtitle: document.getElementById('field-subtitle').value.trim(),
      tag: document.getElementById('field-tag').value.trim(),
      status: document.getElementById('field-status').value,
      badge: document.getElementById('field-badge').value.trim(),
      description: document.getElementById('field-description').value.trim(),
      thumbnail: document.getElementById('field-thumbnail').value.trim(),
      videoUrl: document.getElementById('field-videoUrl').value.trim(),
      price: document.getElementById('field-price').value.trim(),
      originalPrice: document.getElementById('field-originalPrice').value.trim(),
      discount: document.getElementById('field-discount').value.trim(),
      monthlyPrice: document.getElementById('field-monthlyPrice').value.trim(),
      published: document.getElementById('field-published').value === 'true',
      order: parseInt(document.getElementById('field-order').value) || 0,
      releaseDate: document.getElementById('field-release').value.trim(),
      authorName: document.getElementById('field-author').value.trim(),
      rating: document.getElementById('field-rating').value.trim() || '4.9',
      ratingCount: document.getElementById('field-ratingCount').value.trim(),
      learnersCount: document.getElementById('field-learnersCount').value.trim(),
      whatYouWillLearn,
      requirements,
      relatedTopics,
      curriculum: curriculumState
    };

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Saving Course...</span>`;
    }

    try {
      const url = isEdit ? `/api/admin/courses/${courseId}` : '/api/admin/courses';
      const method = isEdit ? 'PUT' : 'POST';

      const token = window.getAdminToken ? window.getAdminToken() : localStorage.getItem('adminToken');
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save course');
      }

      const savedData = await res.json();
      const savedCourse = savedData.course || savedData;

      if (!isEdit && savedCourse && savedCourse.id) {
        document.getElementById('edit-course-id').value = savedCourse.id;
        // Update URL query string to match new ID without full page reload
        window.history.replaceState({}, '', `admin-course-editor.html?id=${encodeURIComponent(savedCourse.id)}`);
      }

      if (window.showAdminToast) {
        window.showAdminToast('Course details saved successfully!', 'success', 'Course Saved');
      } else {
        alert('Course saved successfully!');
      }

      // Update header titles and preview link
      const headingTitle = document.getElementById('page-title-text');
      if (headingTitle) headingTitle.textContent = `Editing: ${payload.title}`;
      const previewBtn = document.getElementById('btn-public-preview');
      if (previewBtn) previewBtn.href = `course-detail.html?id=${encodeURIComponent(payload.slug)}`;

    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save course: ' + err.message);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span>Save All Changes</span>`;
      }
    }
  };

})();
