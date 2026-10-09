(() => {
  'use strict';
  function updateCountLabels() {
    document.querySelectorAll('.measure-card header span').forEach(label => { label.textContent = 'COUNT'; });
    document.querySelectorAll('.score-entry span').forEach(unit => { unit.textContent = '個'; });
    document.querySelectorAll('#podium strong').forEach(score => { score.textContent = score.textContent.replace(/\s*g$/, ' 個'); });
  }
  new MutationObserver(updateCountLabels).observe(document.querySelector('#deck'), { childList: true, subtree: true });
  updateCountLabels();
})();
