/**
 * @file server.js
 * 메인 서버 파일입니다.
 * Express, Socket.IO를 초기화하고 각 모듈을 연결하여 서버를 실행합니다.
 */

// --- 기본 모듈 로드 ---
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

// --- 커스텀 모듈 로드 (변경) ---
// require 구문을 import로 변경하고, 파일 확장자(.js)를 반드시 포함해야 합니다.
import * as roomManager from './game-modules/room-manager.js';
import * as gameLogic from './game-modules/game-logic.js';
import * as constants from './game-modules/constants.js';

// --- 서버 및 소켓 초기화 ---
const app = express();
const server = http.createServer(app);
// Socket.IO 초기화 방식이 약간 변경될 수 있습니다. new Server()를 사용합니다.
const io = new Server(server);

app.use(express.static('public'));

// --- 전역 상태 ---
// 활성화된 모든 게임방의 정보를 저장하는 객체
let rooms = {};

// --- Socket.IO 연결 처리 ---
io.on('connection', (socket) => {
  console.log(`[${socket.id}] 유저 접속!`);

  // 1. 로비 참가 및 방 목록 전송
  socket.join('lobby');
  roomManager.broadcastLobbyUpdate(io, rooms);

  // 새로 접속한 클라이언트에게는 딱 한 번, 기본 게임 정보를 보내줍니다.
  socket.emit('initial:data', { snails: constants.SNAILS });

  // 2. 방 만들기 요청 처리
  socket.on('lobby:createRoom', (roomName) => {
    roomManager.createRoom(socket, roomName, rooms, io);
  });

  // 3. 방 참가 요청 처리
  socket.on('lobby:joinRoom', (roomId) => {
    roomManager.joinRoom(socket, roomId, rooms, io);
  });

  // 4. 방 나가기 요청 처리
  socket.on('lobby:leaveRoom', () => {
    roomManager.leaveRoom(socket, rooms, io);
  });

  // 5. 연결 끊김 처리
  socket.on('disconnect', () => {
    console.log(`[${socket.id}] 유저 접속 해제`);
    // removeUserFromRoom은 leaveRoom과 달리 콜백만 실행 (클라이언트가 이미 떠났으므로)
    roomManager.removeUserFromRoom(socket, rooms, () => {
      roomManager.broadcastLobbyUpdate(io, rooms);
    });
  });

  // 6. 닉네임 변경 요청 처리
  socket.on('user:setNickname', (nickname) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId] || !rooms[roomId].users[socket.id]) return;

    if (!nickname || nickname.length < 2 || nickname.length > 10) {
      return socket.emit(
        'alert',
        '닉네임은 2자 이상 10자 이하로 입력해주세요.',
      );
    }

    const isDuplicate = Object.values(rooms[roomId].users).some(
      (user) => user.nickname === nickname,
    );
    if (isDuplicate) {
      return socket.emit('alert', '이미 사용 중인 닉네임입니다.');
    }

    rooms[roomId].users[socket.id].nickname = nickname;
    gameLogic.updateLeaderboard(roomId, rooms, io);
    socket.emit('chat:message', {
      nickname: '시스템',
      message: `닉네임이 [${nickname}] (으)로 변경되었습니다.`,
    });
  });

  // 7. 채팅 메시지 처리
  socket.on('chat:message', (message) => {
    const roomId = socket.roomId;
    const room = rooms[roomId];
    if (!room || !room.users[socket.id]) return;

    if (message && message.length > 0) {
      const chatData = { nickname: room.users[socket.id].nickname, message };
      io.to(roomId).emit('chat:message', chatData);

      room.chatHistory.push(chatData);
      if (room.chatHistory.length > 30) {
        room.chatHistory.shift();
      }
    }
  });

  // 8. 베팅 요청 처리
  socket.on('race:bet', (data) => {
    const roomId = socket.roomId;
    const room = rooms[roomId];
    if (!room) return;
    const { raceState, users } = room;

    if (raceState.status !== 'COUNTDOWN') {
      return socket.emit('alert', '베팅 시간이 아닙니다.');
    }
    const user = users[socket.id];
    const amount = parseInt(data.amount, 10);

    if (
      !user ||
      user.points < amount ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return socket.emit(
        'alert',
        '포인트가 부족하거나 잘못된 베팅 금액입니다.',
      );
    }
    if (!raceState.bets[data.snail]) {
      return socket.emit('alert', '존재하지 않는 달팽이입니다.');
    }

    user.points -= amount;
    const betInfo = raceState.bets[data.snail];
    betInfo.total += amount;
    betInfo.bettors[socket.id] = (betInfo.bettors[socket.id] || 0) + amount;

    socket.emit('update:points', user.points);
    gameLogic.updateLeaderboard(roomId, rooms, io);
    gameLogic.calculateAndBroadcastOdds(roomId, rooms, io);
    socket.emit('alert', `${data.snail}에게 ${amount}P를 베팅했습니다.`);
  });
});

// --- 서버 실행 ---
const PORT = 3000;
server.listen(PORT, () =>
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`),
);

// --- 서버 안정성 강화를 위한 전역 에러 핸들러 ---

// 처리되지 않은 예외 (동기적 에러) - 예: 정의되지 않은 변수 사용 등
process.on('uncaughtException', (err) => {
  console.error('처리되지 않은 예외가 발생했습니다:', err);
  // PM2가 재시작할 수 있도록 프로세스를 의도적으로 종료합니다.
  process.exit(1);
});

// 처리되지 않은 프로미스 거부 (비동기적 에러) - 예: .catch()가 없는 비동기 함수의 실패 등
process.on('unhandledRejection', (reason, promise) => {
  console.error('처리되지 않은 프로미스 거부가 발생했습니다:', reason);
  process.exit(1);
});
