// next2next preview — AI photo estimate screen behavior.
// Scripted result: no real analysis happens, by design (see brief).

(function () {
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
