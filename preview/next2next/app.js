// next2next preview — shared behavior for estimate.html and dashboard.html.
// Everything here is client-side and scripted; no real analysis or backend.

(function photoEstimate() {
  var fileInput = document.getElementById('file-input');
  if (!fileInput) return; // only present on estimate.html

  var uploadStage = document.getElementById('upload-stage');
  var analysisStage = document.getElementById('analysis-stage');
  var previewImg = document.getElementById('preview-img');
  var scanOverlay = document.getElementById('scan-overlay');
  var scanStatusText = document.getElementById('scan-status-text');
  var resultBlock = document.getElementById('result-block');
  var resetLink = document.getElementById('reset-link');
  var itemCheckboxes = Array.prototype.slice.call(document.querySelectorAll('#item-list input[type="checkbox"]'));
  var itemCountSub = document.getElementById('item-count-sub');
  var crewSelector = document.getElementById('crew-selector');
  var crewButtons = crewSelector ? Array.prototype.slice.call(crewSelector.querySelectorAll('.crew-btn')) : [];
  var totalTimeValue = document.getElementById('total-time-value');
  var totalTimeSub = document.getElementById('total-time-sub');

  var statusPhrases = ['Detecting furniture…', 'Estimating volume…', 'Calculating crew size…'];

  // Diminishing returns: more crew is faster, but not linearly -- coordination
  // overhead and tasks that already need 2+ people mean a 6-person crew isn't
  // 3x a 2-person crew.
  var crewEfficiency = { 2: 1.7, 3: 2.3, 4: 2.8, 5: 3.2, 6: 3.5 };
  var activeCrew = 3;

  function formatMinutes(total) {
    var hrs = Math.floor(total / 60);
    var mins = Math.round(total % 60);
    if (hrs === 0) return mins + 'm';
    if (mins === 0) return hrs + 'h';
    return hrs + 'h ' + mins + 'm';
  }

  function updateEstimate() {
    var checkedMinutes = 0;
    var checkedCount = 0;

    itemCheckboxes.forEach(function (box) {
      var row = box.closest('.item-row');
      row.classList.toggle('is-unchecked', !box.checked);
      if (box.checked) {
        checkedMinutes += Number(box.dataset.minutes);
        checkedCount++;
      }
    });

    if (itemCountSub) itemCountSub.textContent = '(' + checkedCount + ' of ' + itemCheckboxes.length + ' selected)';

    if (checkedMinutes === 0) {
      totalTimeValue.textContent = '—';
      totalTimeSub.textContent = 'Select at least one item';
      return;
    }

    var totalMinutes = checkedMinutes / crewEfficiency[activeCrew];
    totalTimeValue.textContent = formatMinutes(totalMinutes);
    totalTimeSub.textContent = checkedCount + ' item' + (checkedCount === 1 ? '' : 's') + ' selected · ' + activeCrew + ' crew';
  }

  itemCheckboxes.forEach(function (box) {
    box.addEventListener('change', updateEstimate);
  });

  crewButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeCrew = Number(btn.dataset.crew);
      crewButtons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      updateEstimate();
    });
    if (Number(btn.dataset.crew) === activeCrew) btn.classList.add('is-active');
  });

  fileInput.addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (evt) {
      previewImg.src = evt.target.result;
      startAnalysis();
    };
    reader.readAsDataURL(file);
  });

  function startAnalysis() {
    uploadStage.classList.add('hidden');
    analysisStage.classList.remove('hidden');
    scanOverlay.classList.remove('hidden');
    resultBlock.classList.add('hidden');

    var phraseIndex = 0;
    scanStatusText.textContent = statusPhrases[0];
    var phraseTimer = setInterval(function () {
      phraseIndex = (phraseIndex + 1) % statusPhrases.length;
      scanStatusText.textContent = statusPhrases[phraseIndex];
    }, 420);

    setTimeout(function () {
      clearInterval(phraseTimer);
      scanOverlay.classList.add('hidden');
      resultBlock.classList.remove('hidden');
      updateEstimate();
    }, 1200);
  }

  resetLink.addEventListener('click', function (e) {
    e.preventDefault();
    fileInput.value = '';
    analysisStage.classList.add('hidden');
    uploadStage.classList.remove('hidden');

    // reset the checklist/crew back to defaults for the next photo
    itemCheckboxes.forEach(function (box) { box.checked = true; });
    activeCrew = 3;
    crewButtons.forEach(function (b) { b.classList.toggle('is-active', Number(b.dataset.crew) === 3); });
  });
})();

(function sidebarShell() {
  var appShell = document.getElementById('app-shell');
  if (!appShell) return; // present on tracking/estimate/dashboard, all share this shell

  // --- mobile sidebar (off-canvas) ---
  var menuBtn = document.getElementById('menu-btn');
  var backdrop = document.getElementById('sidebar-backdrop');
  var closeBtn = document.getElementById('sidebar-close-btn');

  function closeSidebar() { appShell.classList.remove('sidebar-open'); }
  if (menuBtn) menuBtn.addEventListener('click', function () { appShell.classList.add('sidebar-open'); });
  if (backdrop) backdrop.addEventListener('click', closeSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
})();

(function dashboardJobs() {
  var jobsBody = document.getElementById('jobs-body');
  if (!jobsBody) return; // only present on dashboard.html

  // --- loading skeleton (table + KPI cards) ---
  var skeletonRows = document.getElementById('jobs-skeleton');
  var kpiCards = document.querySelectorAll('[data-kpi]');
  var refreshBtn = document.getElementById('refresh-btn');
  var isLoading = true;

  function showLoading() {
    isLoading = true;
    skeletonRows.classList.remove('hidden');
    jobsBody.classList.add('hidden');
    document.getElementById('jobs-empty').classList.add('hidden');
    kpiCards.forEach(function (c) { c.classList.add('is-loading'); });
  }

  function showLoaded() {
    isLoading = false;
    skeletonRows.classList.add('hidden');
    kpiCards.forEach(function (c) { c.classList.remove('is-loading'); });
    applyFilter(); // re-apply whatever filter state is active
  }

  function load() {
    showLoading();
    setTimeout(showLoaded, 600);
  }

  if (refreshBtn) refreshBtn.addEventListener('click', load);
  load();

  // --- jobs filter + empty state + row count ---
  var filterInput = document.getElementById('jobs-filter');
  var emptyState = document.getElementById('jobs-empty');
  var emptyTitle = document.getElementById('jobs-empty-title');
  var footer = document.getElementById('jobs-footer');
  var clearBtn = document.getElementById('jobs-clear-filter');
  var allRows = jobsBody ? Array.prototype.slice.call(jobsBody.querySelectorAll('tr')) : [];
  var totalCount = allRows.length;

  function applyFilter() {
    if (isLoading) return;
    var query = (filterInput.value || '').trim().toLowerCase();
    var visible = 0;

    allRows.forEach(function (row) {
      var haystack = (row.dataset.customer + ' ' + row.dataset.status).toLowerCase();
      var match = haystack.indexOf(query) !== -1;
      row.style.display = match ? '' : 'none';
      if (match) visible++;
    });

    if (visible === 0) {
      jobsBody.classList.add('hidden');
      emptyState.classList.remove('hidden');
      emptyTitle.textContent = query ? 'No jobs match "' + filterInput.value.trim() + '"' : 'No jobs match your filter';
    } else {
      jobsBody.classList.remove('hidden');
      emptyState.classList.add('hidden');
    }

    footer.textContent = 'Showing ' + visible + ' of ' + totalCount + ' jobs';
  }

  if (filterInput) filterInput.addEventListener('input', applyFilter);
  if (clearBtn) clearBtn.addEventListener('click', function () {
    filterInput.value = '';
    applyFilter();
  });
})();

(function jobsPage() {
  var body = document.getElementById('all-jobs-body');
  if (!body) return; // only present on jobs.html

  var rows = Array.prototype.slice.call(body.querySelectorAll('tr'));
  var totalCount = rows.length;
  var searchInput = document.getElementById('jobs-search');
  var chips = Array.prototype.slice.call(document.querySelectorAll('#status-chips .chip'));
  var emptyState = document.getElementById('jobs-empty');
  var footer = document.getElementById('all-jobs-footer');
  var clearBtn = document.getElementById('jobs-clear-filters');
  var activeStatus = 'all';

  function applyFilters() {
    var query = (searchInput.value || '').trim().toLowerCase();
    var visible = 0;

    rows.forEach(function (row) {
      var matchesStatus = activeStatus === 'all' || row.dataset.status === activeStatus;
      var haystack = (row.dataset.customer + ' ' + row.dataset.route + ' ' + row.dataset.crew).toLowerCase();
      var matchesQuery = haystack.indexOf(query) !== -1;
      var match = matchesStatus && matchesQuery;
      row.style.display = match ? '' : 'none';
      if (match) visible++;
    });

    if (visible === 0) {
      body.classList.add('hidden');
      emptyState.classList.remove('hidden');
    } else {
      body.classList.remove('hidden');
      emptyState.classList.add('hidden');
    }

    footer.textContent = 'Showing ' + visible + ' of ' + totalCount + ' jobs';
  }

  searchInput.addEventListener('input', applyFilters);
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      activeStatus = chip.dataset.status;
      chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
      applyFilters();
    });
  });
  clearBtn.addEventListener('click', function () {
    searchInput.value = '';
    activeStatus = 'all';
    chips.forEach(function (c) { c.classList.toggle('is-active', c.dataset.status === 'all'); });
    applyFilters();
  });
})();

(function customersPage() {
  var body = document.getElementById('customers-body');
  if (!body) return; // only present on customers.html

  var rows = Array.prototype.slice.call(body.querySelectorAll('tr'));
  var totalCount = rows.length;
  var searchInput = document.getElementById('customers-search');
  var emptyState = document.getElementById('customers-empty');
  var emptyTitle = document.getElementById('customers-empty-title');
  var footer = document.getElementById('customers-footer');
  var clearBtn = document.getElementById('customers-clear-search');

  function applyFilter() {
    var query = (searchInput.value || '').trim().toLowerCase();
    var visible = 0;

    rows.forEach(function (row) {
      var match = row.dataset.name.toLowerCase().indexOf(query) !== -1;
      row.style.display = match ? '' : 'none';
      if (match) visible++;
    });

    if (visible === 0) {
      body.classList.add('hidden');
      emptyState.classList.remove('hidden');
      emptyTitle.textContent = query ? 'No customers match "' + searchInput.value.trim() + '"' : 'No customers match your search';
    } else {
      body.classList.remove('hidden');
      emptyState.classList.add('hidden');
    }

    footer.textContent = 'Showing ' + visible + ' of ' + totalCount + ' customers';
  }

  searchInput.addEventListener('input', applyFilter);
  clearBtn.addEventListener('click', function () { searchInput.value = ''; applyFilter(); });
})();

(function settingsPage() {
  var saveBtn = document.getElementById('settings-save');
  if (!saveBtn) return; // only present on settings.html

  var saved = document.getElementById('settings-saved');
  var timer;

  saveBtn.addEventListener('click', function () {
    saved.classList.add('is-visible');
    clearTimeout(timer);
    timer = setTimeout(function () { saved.classList.remove('is-visible'); }, 2000);
  });
})();
