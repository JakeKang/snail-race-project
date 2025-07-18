/**
 * @file game-loop.js
 * 게임의 주기적인 로직(루프)을 담당합니다.
 */

import {
  calculateAndBroadcastOdds,
  startRace,
  finishRace,
  getLeaderIndex,
  getLastPlaceIndex,
} from './game-logic.js';
import { SNAILS, RACE_DISTANCE, RACE_EVENTS } from './constants.js';

/**
 * 메인 게임 루프. 1초마다 실행되며 게임 상태(대기, 카운트다운)를 관리합니다.
 * @param {string} roomId - 방 ID
 * @param {object} rooms - 전체 방 목록 객체
 * @param {SocketIO.Server} io - Socket.IO 서버 인스턴스
 */
function gameLoop(roomId, rooms, io) {
  const room = rooms[roomId];
  if (!room) return;
  const { raceState } = room;

  if (raceState.status === 'WAITING') {
    raceState.status = 'COUNTDOWN';
    io.to(roomId).emit('race:prepare', {
      weather: raceState.weather,
      countdown: raceState.countdown,
    });
    calculateAndBroadcastOdds(roomId, rooms, io);
  } else if (raceState.status === 'COUNTDOWN') {
    raceState.countdown--;
    io.to(roomId).emit('race:countdown', raceState.countdown);
    if (raceState.countdown <= 0) {
      startRace(roomId, rooms, io);
    }
  }
}

/**
 * 레이싱 루프. 100ms마다 실행되며 달팽이의 위치를 계산하고 업데이트합니다.
 * @param {string} roomId - 방 ID
 * @param {object} rooms - 전체 방 목록 객체
 * @param {SocketIO.Server} io - Socket.IO 서버 인스턴스
 */
function runRaceFrame(roomId, rooms, io) {
  const room = rooms[roomId];
  if (!room || room.raceState.status !== 'RACING') return;
  const { raceState } = room;

  // 돌발 이벤트 발생 로직
  if (!raceState.eventTriggered && Math.random() < 0.015) {
    raceState.eventTriggered = true;
    raceState.event =
      RACE_EVENTS[Math.floor(Math.random() * RACE_EVENTS.length)];
    io.to(roomId).emit('race:event', raceState.event);
    // 4초 후 이벤트 효과 사라짐
    setTimeout(() => {
      if (rooms[roomId] && rooms[roomId].raceState) {
        rooms[roomId].raceState.event = null;
      }
    }, 4000);
  }

  // 달팽이 이동 로직
  for (let i = 0; i < SNAILS.length; i++) {
    if (raceState.positions[i] >= RACE_DISTANCE) continue;

    // 밸런스 조정: 기본 속도 범위를 약간 낮춰 전체적인 속도를 늦춥니다.
    let baseSpeed = Math.random() * 1.2 + 0.2; // 0.2 ~ 1.4 범위
    const snail = SNAILS[i];

    // 밸런스 조정: 순간 가속 확률 및 배율 조정
    if (Math.random() < 0.025) {
      baseSpeed *= 1.5; // 순간 가속 배율을 1.5로 조정
    }

    // 특성 적용 (밸런스 조정)
    switch (snail.trait) {
      case 'STEADY':
        baseSpeed = 1.15;
        break;
      case 'SPRINTER':
        if (raceState.positions[i] < 30) baseSpeed *= 1.7;
        break;
      case 'RAIN_LOVER':
        if (raceState.weather === '비') baseSpeed *= 1.5;
        break;
      case 'INTIMIDATOR':
        if (Math.random() < 0.08) {
          for (let j = 0; j < SNAILS.length; j++) {
            if (i !== j) raceState.positions[j] -= 0.04;
          }
        }
        break;
    }

    // 이벤트 효과 적용 (밸런스 조정)
    if (raceState.event) {
      const eventEffect = raceState.event.effect;
      const affectedSnails = [];

      if (eventEffect === 'SPEED_ALL') {
        baseSpeed *= snail.trait === 'LUCKY' ? 1.8 : 1.4;
        affectedSnails.push(i);
      }
      if (
        eventEffect === 'SLOW_LEADER' &&
        i === getLeaderIndex(roomId, rooms)
      ) {
        baseSpeed *= snail.trait === 'LUCKY' ? 1.0 : 0.3;
        affectedSnails.push(i);
      }
      if (
        eventEffect === 'BOOST_LAST' &&
        i === getLastPlaceIndex(roomId, rooms)
      ) {
        baseSpeed *= 2.8;
        affectedSnails.push(i);
      }
      if (eventEffect === 'CONFUSION') {
        baseSpeed *= 0.7;
        affectedSnails.push(i);
      }

      raceState.effects = affectedSnails.map((index) => ({
        index,
        type: raceState.event.effect,
      }));
    }

    raceState.positions[i] = Math.max(0, raceState.positions[i] + baseSpeed);

    // 결승선 통과 처리
    if (
      raceState.positions[i] >= RACE_DISTANCE &&
      !raceState.ranks.some((r) => r.snail === snail.name)
    ) {
      raceState.finishedCount++;
      raceState.ranks.push({
        snail: snail.name,
        rank: raceState.finishedCount,
      });
    }
  }

  // 위치 및 이펙트 정보 업데이트 전송
  io.to(roomId).emit('race:update', {
    positions: raceState.positions,
    ranks: raceState.ranks,
    effects: raceState.effects || [],
  });

  // 이펙트 정보 초기화
  if (raceState.effects) raceState.effects = [];

  // 모든 달팽이가 도착하면 경주 종료
  if (raceState.finishedCount === SNAILS.length) {
    finishRace(roomId, rooms, io);
  }
}

export { gameLoop, runRaceFrame };
