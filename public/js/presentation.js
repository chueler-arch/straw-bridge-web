(() => {
  'use strict';
  const slide = document.querySelector('.presentation-slide');
  const teamList = document.querySelector('#presentationTeamList');
  const teamName = document.querySelector('#presentationTeamName');
  const memberList = document.querySelector('#presentationMemberList');
  const applauseButton = document.querySelector('#presentationApplauseBtn');
  if (!slide || !teamList || !teamName || !memberList || !applauseButton) return;

  const stateKey = 'straw-bridge-state-v1';
  let selectedIndex = 0;

  function readTeams() {
    try {
      return JSON.parse(localStorage.getItem(stateKey) || '{}').teams || [];
    } catch {
      return [];
    }
  }

  function showTeam(teams, index) {
    selectedIndex = Math.max(0, Math.min(index, teams.length - 1));
    const team = teams[selectedIndex];
    teamList.querySelectorAll('button').forEach((button, buttonIndex) => {
      const selected = buttonIndex === selectedIndex;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    teamName.textContent = team?.name || 'チームを選択';
    memberList.replaceChildren();
    const members = team?.members?.length ? team.members : ['参加者未登録'];
    members.forEach(member => {
      const item = document.createElement('li');
      item.textContent = member;
      memberList.appendChild(item);
    });
    document.dispatchEvent(new CustomEvent('strawbridge:reset-timer', { detail: { key: 'presentation' } }));
  }

  function render() {
    const teams = readTeams();
    teamList.replaceChildren();
    teams.forEach((team, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = team.name;
      button.addEventListener('click', () => showTeam(teams, index));
      teamList.appendChild(button);
    });
    if (teams.length) showTeam(teams, Math.min(selectedIndex, teams.length - 1));
    else {
      teamName.textContent = 'チームが登録されていません';
      memberList.replaceChildren();
    }
    applauseButton.disabled = !teams.length;
  }

  applauseButton.addEventListener('click', () => {
    window.strawBridgeCelebrate?.();
  });

  new MutationObserver(() => {
    if (slide.classList.contains('is-active')) render();
  }).observe(slide, { attributes: true, attributeFilter: ['class'] });

  render();
})();
