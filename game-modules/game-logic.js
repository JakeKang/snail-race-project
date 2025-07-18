/**
 * @file game-logic.js
 * 경주 시작/종료, 배당률/순위표 계산 등 핵심 게임 규칙 로직을 담당합니다.
 */

// 변경: 필요한 모듈들을 모두 파일 최상단에서 import 합니다.
import { SNAILS, RACE_DISTANCE } from './constants.js';
import { createRaceState } from './state.js';
import { gameLoop } from './game-loop.js';

/**
 * 선두 달팽이의 인덱스를 반환합니다.
 * @param {string} roomId - 방 ID
 * @param {object} rooms - 전체 방 목록 객체
 * @returns {number} 선두 달팽이의 인덱스, 없으면 -1
 */
function getLeaderIndex(roomId, rooms) {
  const room = rooms[roomId];
  if (!room) return -1;
  const { positions } = room.raceState;
  let leaderIndex = -1;
  let maxPos = -1;
  for (let i = 0; i < positions.length; i++) {
    // 아직 도착하지 않은 달팽이 중에서만 리더를 찾음
    if (positions[i] < RACE_DISTANCE && positions[i] > maxPos) {
      maxPos = positions[i];
      leaderIndex = i;
    }
  }
  return leaderIndex;
}

/**
 * 꼴등 달팽이의 인덱스를 반환합니다.
 * @param {string} roomId - 방 ID
 * @param {object} rooms - 전체 방 목록 객체
 * @returns {number} 꼴등 달팽이의 인덱스, 없으면 -1
 */
function getLastPlaceIndex(roomId, rooms) {
  const room = rooms[roomId];
  if (!room) return -1;
  const { positions, ranks } = room.raceState;
  let lastIndex = -1;
  let minPos = RACE_DISTANCE;

  for (let i = 0; i < positions.length; i++) {
    // 아직 도착하지 않은 달팽이 중에서 가장 뒤에 있는 달팽이를 찾음
    if (
      positions[i] < minPos &&
      !ranks.some((r) => r.snail === SNAILS[i].name)
    ) {
      minPos = positions[i];
      lastIndex = i;
    }
  }
  return lastIndex;
}

/**
 * 경주 시작을 처리하고 클라이언트에게 알립니다.
 * @param {string} roomId - 방 ID
 * @param {object} rooms - 전체 방 목록 객체
 * @param {SocketIO.Server} io - Socket.IO 서버 인스턴스
 */
function startRace(roomId, rooms, io) {
  const room = rooms[roomId];
  if (!room) return;
  room.raceState.status = 'RACING';
  io.to(roomId).emit('race:start');
  console.log(`[${roomId}] 경주 시작! 날씨: ${room.raceState.weather}`);
}

/**
 * 경주가 종료된 후, 승자를 판정하고 베팅 결과를 정산합니다.
 * @param {string} roomId - 방 ID
 * @param {object} rooms - 전체 방 목록 객체
 * @param {SocketIO.Server} io - Socket.IO 서버 인스턴스
 */
function finishRace(roomId, rooms, io) {
  const room = rooms[roomId];
  if (!room || room.raceState.status === 'FINISHED') return;
  room.raceState.status = 'FINISHED';

  const winner = room.raceState.ranks.find((r) => r.rank === 1);

  if (!winner) {
    setTimeout(() => {
      if (rooms[roomId]) {
        // 변경: require 구문 삭제. 이미 상단에서 import 했기 때문입니다.
        rooms[roomId].raceState = createRaceState();
      }
    }, 8000);
    return;
  }

  io.to(roomId).emit('race:finish', {
    ranks: room.raceState.ranks,
    winner: winner.snail,
  });
  console.log(`[${roomId}] 경주 종료! 우승: ${winner.snail}`);

  // 1. 베팅 결과 정산 (각 유저의 포인트 업데이트)
  const winningBets = room.raceState.bets[winner.snail];
  for (const socketId in winningBets.bettors) {
    if (room.users[socketId]) {
      const betAmount = winningBets.bettors[socketId];
      const payout = Math.floor(
        betAmount * (room.raceState.odds[winner.snail] || 1),
      );
      room.users[socketId].points += payout;
      // 'update:points' 이벤트를 여기서 먼저 보냅니다.
      io.to(socketId).emit('update:points', room.users[socketId].points);
      io.to(socketId).emit('alert', `베팅 성공! ${payout}P를 획득했습니다!`);
    }
  }

  // 2. 모든 포인트 정산이 끝난 후, 최종 리더보드를 브로드캐스트합니다.
  // 약간의 딜레이를 주어 'update:points'가 먼저 처리될 시간을 확보합니다.
  setTimeout(() => {
    updateLeaderboard(roomId, rooms, io);
  }, 100);

  // 8초 후 다음 경주를 위해 상태 초기화
  setTimeout(() => {
    if (rooms[roomId]) {
      rooms[roomId].raceState = createRaceState();
      gameLoop(roomId, rooms, io);
    }
  }, 8000);
}

/**
 * 방의 리더보드 정보를 계산하고 해당 방의 모든 유저에게 전송합니다.
 * @param {string} roomId - 방 ID
 * @param {object} rooms - 전체 방 목록 객체
 * @param {SocketIO.Server} io - Socket.IO 서버 인스턴스
 */
function updateLeaderboard(roomId, rooms, io) {
  const room = rooms[roomId];
  if (!room) return;

  const leaderboard = Object.values(room.users)
    .sort((a, b) => b.points - a.points)
    .map((user) => ({ nickname: user.nickname, points: user.points }));
  io.to(roomId).emit('update:leaderboard', leaderboard);
}

/**
 * 방의 배당률을 계산하고 해당 방의 모든 유저에게 전송합니다.
 * @param {string} roomId - 방 ID
 * @param {object} rooms - 전체 방 목록 객체
 * @param {SocketIO.Server} io - Socket.IO 서버 인스턴스
 */
function calculateAndBroadcastOdds(roomId, rooms, io) {
  const room = rooms[roomId];
  if (!room) return;
  const { raceState } = room;

  const totalPool = Object.values(raceState.bets).reduce(
    (sum, betInfo) => sum + betInfo.total,
    0,
  );

  // 밸런스 조정: 기본 풀을 추가하여 배당률 변동을 완만하게 만듭니다.
  const basePool = SNAILS.length * 50; // 기본 풀 (숫자가 클수록 배당률 변동이 적어짐)
  const adjustedTotalPool = totalPool + basePool;

  if (totalPool === 0) {
    SNAILS.forEach((s) => (raceState.odds[s.name] = 2.0));
  } else {
    SNAILS.forEach((s) => {
      // 밸런스 조정: 각 달팽이의 풀에도 기본값을 더해줍니다.
      const snailPool = raceState.bets[s.name].total + basePool / SNAILS.length;

      if (snailPool === 0) {
        // 이 경우는 거의 없지만 안전장치로 남겨둡니다.
        raceState.odds[s.name] = 8.0;
      } else {
        // 밸런스 조정: 새로운 배당률 공식 적용
        const odd = Math.max(
          1.3, // 최소 배당률 상향
          Math.min(8.0, (adjustedTotalPool / snailPool) * 0.9), // 최대 배당률 하향 및 계수 조정
        );
        raceState.odds[s.name] = parseFloat(odd.toFixed(2));
      }
    });
  }
  io.to(roomId).emit('update:odds', raceState.odds);
}

// export 구문은 그대로 유지합니다.
export {
  getLeaderIndex,
  getLastPlaceIndex,
  startRace,
  finishRace,
  updateLeaderboard,
  calculateAndBroadcastOdds,
};
