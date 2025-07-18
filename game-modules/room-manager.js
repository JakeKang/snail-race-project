/**
 * @file room-manager.js
 * 게임방의 생성, 참가, 퇴장 등 사용자 관리 로직을 담당합니다.
 */

// 변경: require -> import, .js 확장자 추가
import { createRaceState } from './state.js';
import { gameLoop, runRaceFrame } from './game-loop.js';
import { updateLeaderboard } from './game-logic.js';
import { MAX_PLAYERS_PER_ROOM } from './constants.js';

/**
 * 로비에 있는 모든 클라이언트에게 현재 방 목록을 브로드캐스트합니다.
 * @param {SocketIO.Server} io - Socket.IO 서버 인스턴스
 * @param {object} rooms - 전체 방 목록 객체
 */
function broadcastLobbyUpdate(io, rooms) {
  const roomList = Object.keys(rooms).map((roomId) => ({
    id: roomId,
    name: rooms[roomId].name,
    playerCount: Object.keys(rooms[roomId].users).length,
  }));
  io.to('lobby').emit('lobby:list', roomList);
}

/**
 * 새 게임방을 생성합니다.
 * @param {SocketIO.Socket} socket - 방 생성을 요청한 클라이언트의 소켓
 * @param {string} roomName - 생성할 방의 이름
 * @param {object} rooms - 전체 방 목록 객체
 * @param {SocketIO.Server} io - Socket.IO 서버 인스턴스
 */
function createRoom(socket, roomName, rooms, io) {
  const roomId = `room-${Date.now()}`;
  socket.leave('lobby');
  socket.join(roomId);

  rooms[roomId] = {
    id: roomId,
    name: roomName,
    users: {},
    raceState: createRaceState(),
    chatHistory: [],
    gameInterval: setInterval(() => gameLoop(roomId, rooms, io), 1000),
    raceInterval: setInterval(() => runRaceFrame(roomId, rooms, io), 100),
  };

  addUserToRoom(socket, roomId, rooms);

  // 클라이언트에게 보낼 데이터만 담은 새로운 객체(payload) 생성
  // 순환 참조를 일으키는 gameInterval, raceInterval을 제외합니다.
  const room = rooms[roomId];
  const payload = {
    id: room.id,
    name: room.name,
    users: room.users,
    raceState: room.raceState,
    chatHistory: room.chatHistory,
  };
  socket.emit('room:joined', payload); // 정제된 데이터만 전송

  broadcastLobbyUpdate(io, rooms);
}
/**
 * 기존 게임방에 참가합니다.
 * @param {SocketIO.Socket} socket - 참가를 요청한 클라이언트의 소켓
 * @param {string} roomId - 참가할 방의 ID
 * @param {object} rooms - 전체 방 목록 객체
 * @param {SocketIO.Server} io - Socket.IO 서버 인스턴스
 */
function joinRoom(socket, roomId, rooms, io) {
  const room = rooms[roomId];
  if (!room) return socket.emit('alert', '존재하지 않는 방입니다.');
  if (Object.keys(room.users).length >= MAX_PLAYERS_PER_ROOM) {
    return socket.emit('alert', '방이 가득 찼습니다.');
  }

  socket.leave('lobby');
  socket.join(roomId);

  addUserToRoom(socket, roomId, rooms);

  // 클라이언트에게 보낼 데이터만 담은 새로운 객체(payload) 생성
  // 순환 참조를 일으키는 gameInterval, raceInterval을 제외합니다.
  const payload = {
    id: room.id,
    name: room.name,
    users: room.users,
    raceState: room.raceState,
    chatHistory: room.chatHistory,
  };
  socket.emit('room:joined', payload); // 정제된 데이터만 전송

  updateLeaderboard(roomId, rooms, io);
  broadcastLobbyUpdate(io, rooms);
}

/**
 * 방에서 나갑니다.
 * @param {SocketIO.Socket} socket - 나가기를 요청한 클라이언트의 소켓
 * @param {object} rooms - 전체 방 목록 객체
 * @param {SocketIO.Server} io - Socket.IO 서버 인스턴스
 * @param {function} callback - 유저 제거 후 실행될 콜백 함수
 */
function leaveRoom(socket, rooms, io, callback) {
  removeUserFromRoom(socket, rooms, () => {
    socket.join('lobby');
    socket.emit('room:left');
    broadcastLobbyUpdate(io, rooms);
    if (callback) callback();
  });
}

/**
 * 특정 방에 유저를 추가합니다. (내부 헬퍼 함수)
 */
function addUserToRoom(socket, roomId, rooms) {
  const room = rooms[roomId];
  if (!room) return;

  socket.roomId = roomId;
  room.users[socket.id] = {
    nickname: `익명_${socket.id.substring(0, 4)}`,
    points: 1000,
  };
}

/**
 * 특정 방에서 유저를 제거하고, 방이 비면 방 자체를 삭제합니다. (내부 헬퍼 함수)
 */
function removeUserFromRoom(socket, rooms, callback) {
  const roomId = socket.roomId;
  if (!roomId || !rooms[roomId]) {
    if (callback) callback();
    return;
  }

  socket.leave(roomId);
  delete rooms[roomId].users[socket.id];
  delete socket.roomId;

  if (Object.keys(rooms[roomId].users).length === 0) {
    console.log(`[${roomId}] 방이 비어서 삭제합니다.`);
    clearInterval(rooms[roomId].gameInterval);
    clearInterval(rooms[roomId].raceInterval);
    delete rooms[roomId];
  } else {
    updateLeaderboard(roomId, rooms, io);
  }

  if (callback) callback();
}

export {
  broadcastLobbyUpdate,
  createRoom,
  joinRoom,
  leaveRoom,
  // addUserToRoom,
  removeUserFromRoom,
};
