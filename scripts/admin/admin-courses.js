/**
 * SenpaiWorks Admin Console - Courses Management Module
 * scripts/admin/admin-courses.js
 */

let allAdminCourses = [];

// ── Status pill helper ─────────────────────────────────────
function coursesStatusPill(status) {
  if (!status) return '';
  const lower = status.toLowerCase();
  if (lower.includes('production')) {
    return `<span class="status-pill-admin production">${window.escapeHtml(status)}</span>`;
  }
  if (lower.includes('available') || lower.includes('live')) {
    return `<span class="status-pill-admin available">${window.escapeHtml(status)}</span>`;
  }
  // In Planning / default
  return `<span class="status-pill-admin planning">${window.escapeHtml(status)}</span>`;
}

// ── Load Courses ───────────────────────────────────────────
window.loadAdminCourses = async function () {
  const tableBody = document.getElementById('courses-admin-list-body');
  const countLabel = document.getElementById('courses-admin-table-count');
  if (!tableBody) return;

  try {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i> Loading courses...</td></tr>`;

    const token = window.getAdminToken ? window.getAdminToken() : localStorage.getItem('adminToken');
    const res = await fetch('/api/admin/courses', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load courses');
    allAdminCourses = await res.json();
    window.renderAdminCourses();
  } catch (err) {
    console.error('Error loading courses:', err);
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:#ef4444;">Failed to load courses. Please retry.</td></tr>`;
  }
};

// ── Render Table ───────────────────────────────────────────
window.renderAdminCourses = function () {
  const tableBody = document.getElementById('courses-admin-list-body');
  const countLabel = document.getElementById('courses-admin-table-count');
  if (!tableBody) return;

  const searchInput = document.getElementById('courses-admin-search');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  const filtered = allAdminCourses.filter(c =>
    !query ||
    (c.title && c.title.toLowerCase().includes(query)) ||
    (c.slug && c.slug.toLowerCase().includes(query)) ||
    (c.tag && c.tag.toLowerCase().includes(query)) ||
    (c.status && c.status.toLowerCase().includes(query))
  );

  if (countLabel) {
    countLabel.textContent = `Showing ${filtered.length} of ${allAdminCourses.length} courses`;
  }

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:#94a3b8;">No courses found. Add your first course!</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered.map(c => {
    const thumb = c.thumbnail
      ? `<img src="${window.escapeHtml(c.thumbnail)}" alt="" style="width:60px;height:40px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,0.1);">`
      : `<div style="width:60px;height:40px;background:#1e293b;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#475569;font-size:11px;">No img</div>`;

    const pubBadge = c.published
      ? `<span style="background:#16a34a22;color:#4ade80;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;">Published</span>`
      : `<span style="background:#dc262622;color:#f87171;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;">Hidden</span>`;

    const priceLabel = c.price ? `<span style="color:#38bdf8;font-size:12px;font-weight:600;margin-left:6px;">(${window.escapeHtml(c.price)})</span>` : '';

    return `
      <tr>
        <td style="width:70px;">${thumb}</td>
        <td style="max-width:260px;">
          <a href="admin-course-editor.html?id=${encodeURIComponent(c.id)}" style="color:#e2e8f0;font-weight:700;display:block;text-decoration:none;" onmouseover="this.style.color='#38bdf8'" onmouseout="this.style.color='#e2e8f0'">${window.escapeHtml(c.title)}</a>
          <small style="color:#94a3b8;font-size:11px;">Slug: <code style="color:#38bdf8;">${window.escapeHtml(c.slug || '—')}</code> ${priceLabel}</small>
        </td>
        <td><span style="background:#1e3a5f;color:#60a5fa;padding:2px 8px;border-radius:99px;font-size:11px;">${window.escapeHtml(c.tag || '—')}</span></td>
        <td>${coursesStatusPill(c.status)}</td>
        <td style="color:#94a3b8;font-size:12px;">${window.escapeHtml(c.releaseDate || '—')}</td>
        <td>${pubBadge}</td>
        <td>
          <div style="display:flex;gap:6px;justify-content:center;">
            <a href="admin-course-editor.html?id=${encodeURIComponent(c.id)}" class="faq-btn-edit" style="display:flex;align-items:center;justify-content:center;text-decoration:none;" title="Edit on Full Page">
              <i class="fa-solid fa-pen"></i>
            </a>
            <button class="faq-btn-delete" onclick="window.deleteCourse('${c.id}')" title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

window.openAddCourseModal = function () {
  window.location.href = 'admin-course-editor.html';
};

window.openEditCourseModal = function (id) {
  window.location.href = 'admin-course-editor.html?id=' + encodeURIComponent(id);
};

// ── Curriculum Live Counter & Helpers ───────────────────────
window.updateCurriculumSummaryPill = function () {
  const curEl = document.getElementById('course-input-curriculum');
  const pill = document.getElementById('curriculum-summary-pill');
  if (!curEl || !pill) return;

  try {
    const val = curEl.value.trim();
    if (!val) {
      pill.textContent = '0 sections • 0 lectures';
      pill.style.color = '#94a3b8';
      return;
    }
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) {
      let lecCount = 0;
      parsed.forEach(sec => {
        if (Array.isArray(sec.lectures)) lecCount += sec.lectures.length;
      });
      pill.textContent = `${parsed.length} sections • ${lecCount} lectures`;
      pill.style.color = '#38bdf8';
    } else {
      pill.textContent = 'Invalid format (must be array)';
      pill.style.color = '#f87171';
    }
  } catch (err) {
    pill.textContent = 'JSON syntax error';
    pill.style.color = '#f87171';
  }
};

window.insertSampleSectionTemplate = function () {
  const curEl = document.getElementById('course-input-curriculum');
  if (!curEl) return;

  let currentArray = [];
  try {
    const val = curEl.value.trim();
    if (val) currentArray = JSON.parse(val);
  } catch (e) {
    currentArray = [];
  }

  const nextSecNum = currentArray.length + 1;
  const newSection = {
    sectionTitle: `Section ${nextSecNum}: New Section Title`,
    metaSummary: "2 lectures • 45m",
    lectures: [
      { name: `01. Lecture Overview & Setup`, duration: "15:00", isPreview: true },
      { name: `02. Core Hands-on Practice`, duration: "30:00", isPreview: false }
    ]
  };

  currentArray.push(newSection);
  curEl.value = JSON.stringify(currentArray, null, 2);
  window.updateCurriculumSummaryPill();
  if (window.showAdminToast) window.showAdminToast('Added new section template to curriculum', 'info');
};

window.formatCurriculumJson = function () {
  const curEl = document.getElementById('course-input-curriculum');
  if (!curEl) return;
  try {
    const parsed = JSON.parse(curEl.value.trim() || '[]');
    curEl.value = JSON.stringify(parsed, null, 2);
    window.updateCurriculumSummaryPill();
    if (window.showAdminToast) window.showAdminToast('Curriculum JSON formatted!', 'success');
  } catch (err) {
    alert('JSON Syntax Error: ' + err.message);
  }
};

// ── Open Add Modal ─────────────────────────────────────────
window.openAddCourseModal = function () {
  document.getElementById('course-modal-title').innerHTML = `<i class="fa-solid fa-graduation-cap"></i> Add New Course`;
  document.getElementById('course-edit-id').value = '';

  // Section 1: Basic Info
  document.getElementById('course-input-title').value = '';
  document.getElementById('course-input-slug').value = '';
  document.getElementById('course-input-subtitle').value = '';
  document.getElementById('course-input-tag').value = '3D Digital Art';
  document.getElementById('course-input-status').value = 'In Planning';
  document.getElementById('course-input-badge').value = 'New Masterclass';
  document.getElementById('course-input-description').value = '';

  // Section 2: Media, Pricing & Ratings
  document.getElementById('course-input-thumbnail').value = '';
  document.getElementById('course-input-videoUrl').value = 'https://www.youtube.com/embed/SsoV6Mdjr6A';
  document.getElementById('course-input-price').value = '₹489.00';
  document.getElementById('course-input-originalPrice').value = '₹3,199.00';
  document.getElementById('course-input-discount').value = '84% off';
  document.getElementById('course-input-monthlyPrice').value = '₹375.00';
  document.getElementById('course-input-rating').value = '4.9';
  document.getElementById('course-input-ratingCount').value = '(0 ratings)';
  document.getElementById('course-input-learnersCount').value = '0';
  document.getElementById('course-input-author').value = 'SenpaiWorks Studio';
  document.getElementById('course-input-release').value = 'Release 2026';
  document.getElementById('course-input-order').value = allAdminCourses.length + 1;
  document.getElementById('course-input-published').value = 'true';

  // Section 3: Learning & Requirements
  document.getElementById('course-input-learn').value = '';
  document.getElementById('course-input-topics').value = '';
  document.getElementById('course-input-requirements').value = '';

  // Section 4: Curriculum
  const sampleCurriculum = [
    {
      sectionTitle: "Section 1: Course Setup & Fundamentals",
      metaSummary: "2 lectures • 45m",
      lectures: [
        { name: "01. Introduction & Workspace Overview", duration: "15:00", isPreview: true },
        { name: "02. Core Techniques & Blockout", duration: "30:00", isPreview: false }
      ]
    }
  ];
  document.getElementById('course-input-curriculum').value = JSON.stringify(sampleCurriculum, null, 2);
  window.updateCurriculumSummaryPill();

  document.getElementById('admin-course-modal').style.display = 'flex';
};

// ── Open Edit Modal ────────────────────────────────────────
window.openEditCourseModal = function (id) {
  const c = allAdminCourses.find(x => x.id === id);
  if (!c) return;

  document.getElementById('course-modal-title').innerHTML = `<i class="fa-solid fa-graduation-cap"></i> Edit Course: ${window.escapeHtml(c.title || '')}`;
  document.getElementById('course-edit-id').value = c.id;

  // Section 1: Basic Info
  document.getElementById('course-input-title').value = c.title || '';
  document.getElementById('course-input-slug').value = c.slug || '';
  document.getElementById('course-input-subtitle').value = c.subtitle || '';
  document.getElementById('course-input-tag').value = c.tag || '';
  document.getElementById('course-input-status').value = c.status || 'In Planning';
  document.getElementById('course-input-badge').value = c.badge || '';
  document.getElementById('course-input-description').value = c.description || '';

  // Section 2: Media, Pricing & Ratings
  document.getElementById('course-input-thumbnail').value = c.thumbnail || '';
  document.getElementById('course-input-videoUrl').value = c.videoUrl || '';
  document.getElementById('course-input-price').value = c.price || '';
  document.getElementById('course-input-originalPrice').value = c.originalPrice || '';
  document.getElementById('course-input-discount').value = c.discount || '';
  document.getElementById('course-input-monthlyPrice').value = c.monthlyPrice || '';
  document.getElementById('course-input-rating').value = c.rating || '4.9';
  document.getElementById('course-input-ratingCount').value = c.ratingCount || '';
  document.getElementById('course-input-learnersCount').value = c.learnersCount || '0';
  document.getElementById('course-input-author').value = c.authorName || 'SenpaiWorks Studio';
  document.getElementById('course-input-release').value = c.releaseDate || '';
  document.getElementById('course-input-order').value = c.order || 0;
  document.getElementById('course-input-published').value = c.published ? 'true' : 'false';

  // Section 3: Learning & Requirements
  const learnList = Array.isArray(c.whatYouWillLearn) ? c.whatYouWillLearn : [];
  document.getElementById('course-input-learn').value = learnList.join('\n');

  const topicsList = Array.isArray(c.relatedTopics) ? c.relatedTopics : [];
  document.getElementById('course-input-topics').value = topicsList.join(', ');

  const reqList = Array.isArray(c.requirements) ? c.requirements : [];
  document.getElementById('course-input-requirements').value = reqList.join('\n');

  // Section 4: Curriculum
  const curList = Array.isArray(c.curriculum) ? c.curriculum : [];
  document.getElementById('course-input-curriculum').value = JSON.stringify(curList, null, 2);
  window.updateCurriculumSummaryPill();

  document.getElementById('admin-course-modal').style.display = 'flex';
};

// ── Close Modal ────────────────────────────────────────────
window.closeCourseModal = function () {
  const modal = document.getElementById('admin-course-modal');
  if (modal) modal.style.display = 'none';
};

// ── Save (Add/Edit) ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const courseForm = document.getElementById('admin-course-form');
  const curInput = document.getElementById('course-input-curriculum');
  if (curInput) {
    curInput.addEventListener('input', window.updateCurriculumSummaryPill);
  }

  if (courseForm) {
    courseForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = document.getElementById('course-edit-id').value;
      const isEdit = !!id;

      // Parse What You'll Learn (1 per line)
      const learnText = document.getElementById('course-input-learn').value;
      const whatYouWillLearn = learnText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Parse Related Topics (comma-separated)
      const topicsText = document.getElementById('course-input-topics').value;
      const relatedTopics = topicsText
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Parse Requirements (1 per line)
      const reqText = document.getElementById('course-input-requirements').value;
      const requirements = reqText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Parse Curriculum JSON
      let curriculum = [];
      const curText = document.getElementById('course-input-curriculum').value.trim();
      if (curText) {
        try {
          curriculum = JSON.parse(curText);
          if (!Array.isArray(curriculum)) {
            alert('Curriculum data must be a JSON array of sections.');
            return;
          }
        } catch (err) {
          alert('Invalid Curriculum JSON format:\n' + err.message + '\n\nPlease fix the JSON syntax or click "Prettify JSON".');
          return;
        }
      }

      const payload = {
        title: document.getElementById('course-input-title').value.trim(),
        slug: document.getElementById('course-input-slug').value.trim().toLowerCase(),
        subtitle: document.getElementById('course-input-subtitle').value.trim(),
        tag: document.getElementById('course-input-tag').value.trim(),
        status: document.getElementById('course-input-status').value,
        badge: document.getElementById('course-input-badge').value.trim(),
        description: document.getElementById('course-input-description').value.trim(),
        thumbnail: document.getElementById('course-input-thumbnail').value.trim(),
        videoUrl: document.getElementById('course-input-videoUrl').value.trim(),
        price: document.getElementById('course-input-price').value.trim(),
        originalPrice: document.getElementById('course-input-originalPrice').value.trim(),
        discount: document.getElementById('course-input-discount').value.trim(),
        monthlyPrice: document.getElementById('course-input-monthlyPrice').value.trim(),
        rating: document.getElementById('course-input-rating').value.trim() || '4.9',
        ratingCount: document.getElementById('course-input-ratingCount').value.trim(),
        learnersCount: document.getElementById('course-input-learnersCount').value.trim(),
        authorName: document.getElementById('course-input-author').value.trim(),
        releaseDate: document.getElementById('course-input-release').value.trim(),
        order: parseInt(document.getElementById('course-input-order').value) || 0,
        published: document.getElementById('course-input-published').value === 'true',
        whatYouWillLearn,
        relatedTopics,
        requirements,
        curriculum
      };

      if (!payload.title) { alert('Course title is required.'); return; }

      const saveBtn = document.getElementById('course-modal-submit-btn');
      if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving Course...'; }

      try {
        const url = isEdit ? `/api/admin/courses/${id}` : '/api/admin/courses';
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
          const err = await res.json();
          throw new Error(err.error || 'Save failed');
        }

        window.closeCourseModal();
        await window.loadAdminCourses();
        if (window.showAdminToast) window.showAdminToast(isEdit ? 'Course details updated successfully!' : 'New course created successfully!', 'success');
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save All Course Details'; }
      }
    });
  }

  const searchInput = document.getElementById('courses-admin-search');
  if (searchInput) {
    searchInput.addEventListener('input', window.renderAdminCourses);
  }

  // Listen for sidebar tab click
  document.querySelectorAll('[data-tab="tab-courses"]').forEach(link => {
    link.addEventListener('click', () => {
      if (allAdminCourses.length === 0) window.loadAdminCourses();
    });
  });
});

// ── Delete ─────────────────────────────────────────────────
window.deleteCourse = async function (id) {
  const confirmed = window.showAdminConfirm
    ? await window.showAdminConfirm('Delete Course', 'Are you sure you want to delete this course? This action cannot be undone.', 'Delete', 'danger')
    : confirm('Delete this course? This cannot be undone.');

  if (!confirmed) return;

  try {
    const token = window.getAdminToken ? window.getAdminToken() : localStorage.getItem('adminToken');
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Delete failed');
    await window.loadAdminCourses();
    if (window.showAdminToast) window.showAdminToast('Course deleted successfully.', 'success');
  } catch (err) {
    alert('Error deleting course: ' + err.message);
  }
};

// ── Close modal on overlay click ───────────────────────────
document.addEventListener('click', (e) => {
  const modal = document.getElementById('admin-course-modal');
  if (modal && e.target === modal) window.closeCourseModal();
});
