/**
 * @file state.js
 * 게임의 상태(state)를 생성하는 로직을 담당하는 파일입니다.
 */

// 변경: require -> import, .js 확장자 추가
import { SNAILS, COUNTDOWN_SECONDS, WEATHERS } from './constants.js';

/**
 * 새로운 게임방의 상태 객체를 생성하여 반환합니다.
 * @returns {object} 초기화된 게임 상태 객체 (raceState)
 */
function createRaceState() {
  const snailNames = SNAILS.map((s) => s.name);
  let bets = {};
  snailNames.forEach((name) => {
    bets[name] = { total: 0, bettors: {} };
  });

  return {
    status: 'WAITING',
    countdown: COUNTDOWN_SECONDS,
    weather: WEATHERS[Math.floor(Math.random() * WEATHERS.length)],
    positions: SNAILS.map(() => 0),
    ranks: [],
    finishedCount: 0,
    bets: bets,
    odds: {},
    event: null,
    eventTriggered: false,
  };
}

export { createRaceState };
