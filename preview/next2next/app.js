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

  var statusPhrases = ['Detecting furniture…', 'Estimating volume…', 'Calculating crew size…'];

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
    }, 1200);
  }

  resetLink.addEventListener('click', function (e) {
    e.preventDefault();
    fileInput.value = '';
    analysisStage.classList.add('hidden');
    uploadStage.classList.remove('hidden');
  });
})();

(function dashboard() {
  var appShell = document.getElementById('app-shell');
  if (!appShell) return; // only present on dashboard.html

  // --- mobile sidebar (off-canvas) ---
  var menuBtn = document.getElementById('menu-btn');
  var backdrop = document.getElementById('sidebar-backdrop');
  var closeBtn = document.getElementById('sidebar-close-btn');

  function closeSidebar() { appShell.classList.remove('sidebar-open'); }
  if (menuBtn) menuBtn.addEventListener('click', function () { appShell.classList.add('sidebar-open'); });
  if (backdrop) backdrop.addEventListener('click', closeSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);

  // sidebar nav items that don't lead anywhere in this preview shouldn't jump the page
  document.querySelectorAll('.sidebar__link[data-inert]').forEach(function (link) {
    link.addEventListener('click', function (e) { e.preventDefault(); closeSidebar(); });
  });

  // --- loading skeleton (table + KPI cards) ---
  var skeletonRows = document.getElementById('jobs-skeleton');
  var jobsBody = document.getElementById('jobs-body');
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
