(() => {
  'use strict';
  function updateCountLabels() {
    document.querySelectorAll('.measure-card header span').forEach(label => {
      if (label.textContent !== 'COUNT') label.textContent = 'COUNT';
    });
    document.querySelectorAll('.score-entry span').forEach(unit => {
      if (unit.textContent !== '個') unit.textContent = '個';
    });
    document.querySelectorAll('#podium strong').forEach(score => {
      const corrected = score.textContent.replace(/\s*g$/, ' 個');
      if (score.textContent !== corrected) score.textContent = corrected;
    });
  }
  new MutationObserver(updateCountLabels).observe(document.querySelector('#deck'), { childList: true, subtree: true });
  updateCountLabels();
})();
