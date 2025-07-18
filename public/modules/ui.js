/**
 * @file ui.js
 * 사용자 인터페이스(UI)를 업데이트하는 모든 함수를 포함하는 모듈입니다.
 */
import * as dom from './dom.js';

let snails = [],
  finalRanks = [],
  raceEffects = [];
let postRaceCountdownInterval = null; // 경주 종료 후 카운트다운을 위한 변수
const snailEmojis = ['🐌', '🐛', '🐢', '🐍', '🦗'];
let myCurrentBet = null; // 나의 베팅 정보를 저장할 변수

// 현재 닉네임을 반환하는 헬퍼 함수
export const myNickname = () =>
  dom.nicknameInput.value ||
  (socket.id ? `익명_${socket.id.substring(0, 4)}` : '익명');

/**
 * 'lobby' 또는 'game' 뷰를 화면에 표시합니다.
 * @param {string} viewName - 표시할 뷰의 이름 ('lobby' 또는 'game')
 */
export function showView(viewName) {
  dom.lobbyView.classList.add('hidden');
  dom.gameView.classList.add('hidden');

  if (viewName === 'lobby') {
    dom.lobbyView.classList.remove('hidden');
  } else if (viewName === 'game') {
    dom.gameView.classList.remove('hidden');
  }
}

/**
 * 서버로부터 받은 방 목록을 화면에 렌더링합니다.
 * @param {Array<object>} roomsData - 방 정보 객체 배열
 * @param {SocketIO.Socket} socket - 클라이언트 소켓 인스턴스
 */
export function renderRoomList(roomsData, socket) {
  dom.roomList.innerHTML = '';
  if (roomsData.length === 0) {
    const p = document.createElement('p');
    p.textContent = '아직 생성된 방이 없습니다. 첫 번째 방을 만들어보세요!';
    dom.roomList.appendChild(p);
    return;
  }
  roomsData.forEach((room) => {
    const li = document.createElement('li');
    li.className = 'room-item';
    li.dataset.roomId = room.id;
    li.innerHTML = `
            <span class="room-item-name">${room.name}</span>
            <span class="room-item-players">참가자: ${room.playerCount}명</span>
        `;
    li.addEventListener('click', () => {
      socket.emit('lobby:joinRoom', room.id);
    });
    dom.roomList.appendChild(li);
  });
}

/**
 * 서버로부터 받은 달팽이 정보를 Select Box에 렌더링합니다.
 * @param {Array<object>} snailData - 달팽이 정보 객체 배열
 */
export function renderSnailOptions(snailData) {
  snails = snailData.map((s) => s.name);
  dom.snailSelect.innerHTML = '';
  snailData.forEach((s) => {
    const option = document.createElement('option');
    option.value = s.name;
    option.textContent = `${s.name} (${s.description.split(':')[0]})`;
    option.title = s.description;
    dom.snailSelect.appendChild(option);
  });
}

/**
 * 게임 상태에 따라 전체 UI를 업데이트합니다. (방 참가 시 최초 호출용)
 * @param {object} state - 현재 게임 상태 객체
 */
export function updateUIbyRaceState(state) {
  if (state.status === 'COUNTDOWN' || state.status === 'WAITING') {
    prepareRaceUI(state.weather, state.countdown);
  } else if (state.status === 'RACING') {
    handleRaceStart();
  } else if (state.status === 'FINISHED') {
    const winner = state.ranks.find((r) => r.rank === 1);
    handleRaceFinish(winner ? winner.snail : '알 수 없음', state.ranks);
  }
}

/**
 * 캔버스에 경주 화면을 그립니다.
 * @param {Array<number>} positions - 달팽이들의 현재 위치 배열
 */
export function draw(positions) {
  dom.ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);

  const finishLineX = dom.canvas.width - 60;
  dom.ctx.beginPath();
  dom.ctx.moveTo(finishLineX, 0);
  dom.ctx.lineTo(finishLineX, dom.canvas.height);
  dom.ctx.strokeStyle = 'red';
  dom.ctx.setLineDash([10, 5]);
  dom.ctx.lineWidth = 3;
  dom.ctx.stroke();
  dom.ctx.setLineDash([]);

  if (snails.length === 0) return;

  const PADDING_Y = 40;
  const effectiveHeight = dom.canvas.height - PADDING_Y * 2;
  const laneHeight = effectiveHeight / snails.length;

  dom.ctx.font = '30px Arial';
  dom.ctx.textAlign = 'center';

  for (let i = 0; i < snails.length; i++) {
    const x = 20 + (positions[i] / 100) * (dom.canvas.width - 100);
    const y = PADDING_Y + laneHeight * (i + 0.5);
    dom.ctx.fillText(snailEmojis[i % snailEmojis.length], x, y);

    const effect = raceEffects.find((e) => e.index === i);
    if (effect) {
      dom.ctx.font = '24px Arial';
      let effectEmoji = '❓';
      if (effect.type === 'BOOST_LAST' || effect.type === 'SPEED_ALL')
        effectEmoji = '✨';
      if (effect.type === 'SLOW_LEADER' || effect.type === 'CONFUSION')
        effectEmoji = '💫';
      dom.ctx.fillText(effectEmoji, x + 25, y - 25);
      dom.ctx.font = '30px Arial';
    }

    const rankInfo = finalRanks.find((r) => r.snail === snails[i]);
    if (rankInfo) {
      dom.ctx.fillStyle = 'black';
      dom.ctx.font = 'bold 20px Arial';
      dom.ctx.fillText(`${rankInfo.rank}등`, x, y - 30);
    }
  }
}

/**
 * 채팅 메시지를 화면에 추가합니다.
 * @param {string} nickname - 메시지를 보낸 유저의 닉네임
 * @param {string} message - 메시지 내용
 */
export function addChatMessage(nickname, message) {
  const msgEl = document.createElement('div');
  msgEl.classList.add('chat-message');

  if (nickname === '시스템') {
    msgEl.classList.add('system-message');
    msgEl.textContent = message;
  } else {
    const nameEl = document.createElement('span');
    nameEl.classList.add('nickname');
    nameEl.textContent = nickname;
    const textEl = document.createElement('span');
    textEl.textContent = message;
    msgEl.appendChild(nameEl);
    msgEl.appendChild(textEl);

    if (nickname === myNickname()) {
      msgEl.classList.add('my-message');
    } else {
      msgEl.classList.add('other-message');
    }
  }

  dom.chatMessages.appendChild(msgEl);
  dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
}

/**
 * 리더보드 UI를 업데이트합니다.
 * @param {Array<object>} leaderboardData - 리더보드 데이터 배열
 */
export function updateLeaderboard(leaderboardData) {
  dom.leaderboardList.innerHTML = '';
  leaderboardData
    .sort((a, b) => b.points - a.points)
    .forEach((user, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
            <span class="leaderboard-rank">${index + 1}.</span>
            <span class="leaderboard-name">${user.nickname}</span>
            <span class="leaderboard-points">${user.points} P</span>
        `;
      if (user.nickname === myNickname()) {
        li.classList.add('my-rank');
      }
      dom.leaderboardList.appendChild(li);
    });
}

/**
 * 날씨 UI를 업데이트합니다.
 * @param {string} weather - 현재 날씨
 */
export function updateWeather(weather) {
  dom.weatherTextEl.textContent = weather;
  dom.weatherIconEl.textContent = weather === '비' ? '🌧️' : '☀️';
}

/**
 * 배당률 UI를 업데이트합니다.
 * @param {object} odds - 배당률 데이터
 */
export function updateOdds(odds) {
  dom.oddsListEl.innerHTML = '';
  for (const snailName in odds) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${snailName}</span> <span class="odds-value">${odds[
      snailName
    ].toFixed(2)}</span>`;
    dom.oddsListEl.appendChild(li);
  }
}

/**
 * 돌발 이벤트 배너를 표시합니다.
 * @param {object} event - 이벤트 정보
 */
export function showEventBanner(event) {
  dom.eventBannerEl.textContent = event.message;
  dom.eventBannerEl.classList.add('show');
  setTimeout(() => {
    dom.eventBannerEl.classList.remove('show');
  }, 4000);
}

/**
 * 베팅 현황 UI를 업데이트합니다.
 * @param {object} odds - 최신 배당률 데이터
 */
export function updateMyBetStatus(odds) {
  if (!myCurrentBet) return;
  const myBetSnailOdds = odds[myCurrentBet.snail];
  if (myBetSnailOdds) {
    const potentialWinnings = Math.floor(myCurrentBet.amount * myBetSnailOdds);
    dom.myBetTextEl.textContent = `${myCurrentBet.snail}에게 ${myCurrentBet.amount}P 베팅! (예상 획득: ${potentialWinnings}P)`;
    dom.myBetStatusEl.classList.remove('hidden');
  }
}

/**
 * 외부에서 나의 베팅 정보를 설정하는 함수
 * @param {string} snail - 베팅한 달팽이
 * @param {number} amount - 베팅 금액
 */
export function setMyBet(snail, amount) {
  myCurrentBet = { snail, amount };
}

/**
 * 외부에서 이펙트 정보를 업데이트하기 위한 함수
 * @param {Array<object>} newEffects - 서버로부터 받은 새 이펙트 정보
 */
export function setRaceEffects(newEffects) {
  raceEffects = newEffects;
}

/**
 * 경주 중에만 순위 데이터를 내부 변수에 저장하는 함수
 * @param {Array<object>} ranksData - 현재 순위 데이터
 */
export function updateRanksDisplay(ranksData) {
  finalRanks = ranksData;
}

/**
 * 경주 준비 상태의 UI를 설정합니다. (최종 수정본)
 */
export function prepareRaceUI(weather, countdown) {
  if (postRaceCountdownInterval) clearInterval(postRaceCountdownInterval); // 이전 타이머 확실히 제거

  updateWeather(weather);
  dom.raceStatusTextEl.textContent = '다음 경주까지';
  dom.countdownEl.textContent = countdown;
  dom.betButton.disabled = false;
  dom.betAmountInput.disabled = false;
  dom.myBetStatusEl.classList.add('hidden');
  myCurrentBet = null;
  finalRanks = [];
  draw(snails.map(() => 0));
}

/**
 * 경주 시작 시 UI를 업데이트하는 함수 (최종 수정본)
 */
export function handleRaceStart() {
  if (postRaceCountdownInterval) clearInterval(postRaceCountdownInterval); // 이전 타이머 확실히 제거

  dom.raceStatusTextEl.textContent = '경주가 한창 진행 중입니다!';
  dom.countdownEl.textContent = '🏁';
  dom.betButton.disabled = true;
  dom.betAmountInput.disabled = true;
}

/**
 * 경주 종료 시 UI를 업데이트하고 다음 경주 카운트다운을 시작합니다. (최종 수정본)
 */
export function handleRaceFinish(winner, ranksData) {
  finalRanks = ranksData;
  dom.raceStatusTextEl.textContent = `경주 종료! 우승: ${winner}!`;

  let countdown = 8;
  dom.countdownEl.textContent = `(${countdown}초 후)`;

  if (postRaceCountdownInterval) clearInterval(postRaceCountdownInterval);

  postRaceCountdownInterval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      dom.countdownEl.textContent = `(${countdown}초 후)`;
    } else {
      dom.raceStatusTextEl.textContent = `다음 경주를 준비합니다...`;
      dom.countdownEl.textContent = `⏱️`;
      clearInterval(postRaceCountdownInterval);
    }
  }, 1000);
}
