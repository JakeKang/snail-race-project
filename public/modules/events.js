/**
 * @file events.js
 * 모든 DOM 이벤트 리스너와 Socket.IO 이벤트 리스너를 설정하는 모듈입니다.
 */

import * as dom from './dom.js';
import * as ui from './ui.js';

/**
 * 버튼 클릭, 입력 등 사용자의 모든 DOM 이벤트를 설정합니다.
 * @param {SocketIO.Socket} socket - 클라이언트의 소켓 인스턴스
 */
export function initializeDomEventListeners(socket) {
  // 방 만들기 버튼
  dom.createRoomBtn.addEventListener('click', () => {
    const roomName = dom.roomNameInput.value.trim();
    if (roomName.length >= 2 && roomName.length <= 10) {
      socket.emit('lobby:createRoom', roomName);
      dom.roomNameInput.value = '';
    } else {
      alert('방 이름은 2자 이상 10자 이하로 입력해주세요.');
    }
  });

  // 로비로 돌아가기 버튼
  dom.leaveRoomBtn.addEventListener('click', () => {
    socket.emit('lobby:leaveRoom');
  });

  // 베팅 버튼
  dom.betButton.addEventListener('click', () => {
    const selectedSnail = dom.snailSelect.value;
    const amount = dom.betAmountInput.value;
    if (!selectedSnail || !amount || amount <= 0) {
      alert('베팅할 달팽이와 포인트를 정확히 입력해주세요.');
      return;
    }
    socket.emit('race:bet', { snail: selectedSnail, amount: amount });

    // 수정: 나의 베팅 정보를 저장하고, UI 업데이트는 odds 이벤트에 맡김
    ui.setMyBet(selectedSnail, amount);

    dom.betButton.disabled = true;
    dom.betAmountInput.disabled = true;
  });

  // 닉네임 변경 버튼
  dom.nicknameButton.addEventListener('click', () => {
    const newNickname = dom.nicknameInput.value.trim();
    if (newNickname) {
      socket.emit('user:setNickname', newNickname);
    }
  });
  dom.nicknameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') dom.nicknameButton.click();
  });

  // 채팅 전송 버튼
  dom.chatButton.addEventListener('click', () => {
    const message = dom.chatInput.value.trim();
    if (message) {
      socket.emit('chat:message', message);
      dom.chatInput.value = '';
    }
  });
  dom.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') dom.chatButton.click();
  });
}

/**
 * 서버로부터 오는 모든 소켓 이벤트를 수신 대기하고 처리합니다.
 * @param {SocketIO.Socket} socket - 클라이언트의 소켓 인스턴스
 */
export function initializeSocketEventListeners(socket) {
  // 최초 데이터 수신
  socket.on('initial:data', ({ snails: snailData }) =>
    ui.renderSnailOptions(snailData),
  );

  // 로비 관련
  socket.on('lobby:list', (roomsData) => ui.renderRoomList(roomsData, socket));
  socket.on('room:joined', (room) => {
    dom.headerRoomName.textContent = `[${room.name}]`;
    if (room.chatHistory) {
      dom.chatMessages.innerHTML = '';
      room.chatHistory.forEach((chat) =>
        ui.addChatMessage(chat.nickname, chat.message),
      );
    }
    ui.updateUIbyRaceState(room.raceState); // 참가 시 받은 상태로 UI 한번에 업데이트
    ui.showView('game');

    const myInfo = room.users[socket.id] || { nickname: '', points: 1000 };
    dom.nicknameInput.value = myInfo.nickname;
    dom.myPointsEl.textContent = myInfo.points;
    ui.updateLeaderboard(Object.values(room.users));
  });
  socket.on('room:left', () => ui.showView('lobby'));

  // 게임방 내부 이벤트 (핵심 상태 전이)
  socket.on('race:prepare', ({ weather, countdown }) =>
    ui.prepareRaceUI(weather, countdown),
  );
  socket.on(
    'race:countdown',
    (countdown) => (dom.countdownEl.textContent = countdown),
  );
  socket.on('race:start', ui.handleRaceStart);
  socket.on('race:finish', ({ winner, ranks }) =>
    ui.handleRaceFinish(winner, ranks),
  );

  // 게임방 기타 이벤트
  socket.on('race:update', ({ positions, ranks, effects }) => {
    ui.setRaceEffects(effects || []);
    ui.updateRanksDisplay(ranks);
    ui.draw(positions);
  });
  socket.on('race:event', ui.showEventBanner);
  socket.on('update:odds', (odds) => {
    ui.updateOdds(odds);
    ui.updateMyBetStatus(odds);
  });
  socket.on('update:points', (points) => (dom.myPointsEl.textContent = points));
  socket.on('update:leaderboard', ui.updateLeaderboard);
  socket.on('chat:message', ({ nickname, message }) =>
    ui.addChatMessage(nickname, message),
  );
  socket.on('alert', (message) => alert(message));
}
