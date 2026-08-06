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

  var rows = [];
  var totalCount = 0;
  var searchInput = document.getElementById('jobs-search');
  var chips = Array.prototype.slice.call(document.querySelectorAll('#status-chips .chip'));
  var emptyState = document.getElementById('jobs-empty');
  var footer = document.getElementById('all-jobs-footer');
  var clearBtn = document.getElementById('jobs-clear-filters');
  var activeStatus = 'all';

  function rescan() {
    rows = Array.prototype.slice.call(body.querySelectorAll('tr'));
    totalCount = rows.length;
  }

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

  // a job created via the "New job" modal is inserted directly into the DOM;
  // rescan so it's included in the filterable/counted set
  document.addEventListener('jobs:added', function () {
    rescan();
    applyFilters();
  });

  rescan();
  applyFilters();
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

(function jobCreateModal() {
  var openBtn = document.getElementById('new-job-btn');
  if (!openBtn) return; // only present on jobs.html

  var backdrop = document.getElementById('job-modal-backdrop');
  var closeBtn = document.getElementById('job-modal-close');
  var cancelBtn = document.getElementById('job-modal-cancel');
  var form = document.getElementById('job-form');
  var errorEl = document.getElementById('job-modal-error');
  var jobNoEl = document.getElementById('job-modal-jobno');
  var toast = document.getElementById('job-toast');

  var fCustomer = document.getElementById('jf-customer');
  var fPickup = document.getElementById('jf-pickup');
  var fDelivery = document.getElementById('jf-delivery');
  var fDate = document.getElementById('jf-date');
  var fTime = document.getElementById('jf-time');
  var fCrew = document.getElementById('jf-crew');
  var fMovers = document.getElementById('jf-movers');
  var fTruck = document.getElementById('jf-truck');
  var fTotal = document.getElementById('jf-total');
  var fStatus = document.getElementById('jf-status');

  var itemInput = document.getElementById('jf-item-input');
  var itemAddBtn = document.getElementById('jf-item-add');
  var itemList = document.getElementById('jf-item-list');
  var itemChips = Array.prototype.slice.call(document.querySelectorAll('#jf-item-chips .chip'));

  // headcounts mirror crews.html — keeps "Movers" honest against the Crews roster
  var crewSizes = { 'Crew 1': 2, 'Crew 2': 2, 'Crew 3': 2, 'Crew 4': 3, 'Crew 5': 2 };
  var jobNoCounter = 10483;
  var items = [];
  var toastTimer;

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function initials(name) {
    var parts = name.trim().split(/\s+/);
    return parts.map(function (p) { return p[0]; }).join('').slice(0, 2).toUpperCase();
  }

  function renderItems() {
    itemList.innerHTML = '';
    if (items.length === 0) {
      var empty = document.createElement('li');
      empty.className = 'item-builder__empty';
      empty.textContent = 'No items added yet.';
      itemList.appendChild(empty);
      return;
    }
    items.forEach(function (name, i) {
      var li = document.createElement('li');
      li.className = 'item-builder__row';

      var span = document.createElement('span');
      span.textContent = name;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'item-builder__remove';
      btn.setAttribute('aria-label', 'Remove ' + name);
      btn.textContent = '×';
      btn.addEventListener('click', function () {
        items.splice(i, 1);
        renderItems();
      });

      li.appendChild(span);
      li.appendChild(btn);
      itemList.appendChild(li);
    });
  }

  function addItem(name) {
    name = (name || '').trim();
    if (!name) return;
    var exists = items.some(function (i) { return i.toLowerCase() === name.toLowerCase(); });
    if (exists) return;
    items.push(name);
    renderItems();
  }

  itemChips.forEach(function (chip) {
    chip.addEventListener('click', function () { addItem(chip.dataset.item); });
  });

  itemAddBtn.addEventListener('click', function () {
    addItem(itemInput.value);
    itemInput.value = '';
    itemInput.focus();
  });

  itemInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem(itemInput.value);
      itemInput.value = '';
    }
  });

  function updateMovers() {
    var size = crewSizes[fCrew.value];
    fMovers.value = size ? (size + (size === 1 ? ' mover' : ' movers')) : '';
  }
  fCrew.addEventListener('change', updateMovers);

  function todayISO() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  function clearFieldErrors() {
    Array.prototype.slice.call(form.querySelectorAll('.field.has-error')).forEach(function (f) {
      f.classList.remove('has-error');
    });
    errorEl.textContent = '';
  }

  function openModal() {
    form.reset();
    items = [];
    renderItems();
    clearFieldErrors();
    fDate.value = todayISO();
    fCrew.value = 'Crew 1';
    updateMovers();
    jobNoEl.textContent = 'Job No. N2N-' + jobNoCounter;
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { fCustomer.focus(); }, 50);
  }

  function closeModal() {
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', function (e) { if (e.target === backdrop) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && backdrop.classList.contains('is-open')) closeModal();
  });

  function formatTime12(hhmm) {
    var parts = hhmm.split(':');
    var h = parseInt(parts[0], 10);
    var m = parts[1];
    var suffix = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return h12 + ':' + m + ' ' + suffix;
  }

  function formatDateShort(iso) {
    var d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function statusTagClass(status) {
    if (status === 'Delivered') return 'status-tag--good';
    if (status === 'In transit') return 'status-tag--active';
    if (status === 'Cancelled') return 'status-tag--critical';
    return 'status-tag--neutral';
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2600);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearFieldErrors();

    var required = [
      [fCustomer, 'customer name'],
      [fPickup, 'pickup address'],
      [fDelivery, 'delivery address'],
      [fDate, 'move date'],
      [fTime, 'arrival time'],
      [fTruck, 'a truck'],
      [fTotal, 'a total for the job']
    ];
    var missing = required.filter(function (pair) { return !pair[0].value.trim(); });
    if (missing.length) {
      var field = missing[0][0].closest('.field');
      if (field) field.classList.add('has-error');
      errorEl.textContent = 'Enter ' + missing[0][1] + ' to continue.';
      missing[0][0].focus();
      return;
    }

    var customer = fCustomer.value.trim();
    var pickup = fPickup.value.trim();
    var delivery = fDelivery.value.trim();
    var totalNum = parseFloat(fTotal.value.replace(/[^0-9.]/g, '')) || 0;

    var tbody = document.getElementById('all-jobs-body');
    var tr = document.createElement('tr');
    tr.dataset.customer = customer;
    tr.dataset.route = pickup + ' ' + delivery;
    tr.dataset.crew = fCrew.value;
    tr.dataset.status = fStatus.value.toLowerCase();

    tr.innerHTML =
      '<td class="job-cell-td" data-label="Customer"><div class="job-cell"><div class="avatar avatar--sm">' + escapeHtml(initials(customer)) + '</div><span class="job-cell__name">' + escapeHtml(customer) + '</span></div></td>' +
      '<td data-label="Route">' + escapeHtml(pickup) + ' &rarr; ' + escapeHtml(delivery) + '</td>' +
      '<td data-label="Crew">' + escapeHtml(fCrew.value) + '</td>' +
      '<td data-label="Time" class="tabular-nums">' + formatDateShort(fDate.value) + ', ' + formatTime12(fTime.value) + '</td>' +
      '<td data-label="Total" data-align="right" class="tabular-nums">$' + totalNum.toLocaleString('en-US') + '</td>' +
      '<td data-label="Status" data-align="right"><span class="status-tag ' + statusTagClass(fStatus.value) + '">' + escapeHtml(fStatus.value) + '</span></td>';

    tbody.insertBefore(tr, tbody.firstChild);
    document.dispatchEvent(new CustomEvent('jobs:added'));

    var jobNo = 'N2N-' + jobNoCounter;
    jobNoCounter++;

    closeModal();
    showToast('Job ' + jobNo + ' created for ' + customer + '.');
  });

  renderItems();
})();
