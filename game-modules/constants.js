/**
 * @file constants.js
 * 게임 전체에서 사용되는 상수들을 정의하는 파일입니다.
 * 달팽이 정보, 날씨, 이벤트, 게임 설정값 등을 포함합니다.
 */

// 달팽이 정보
// 각 달팽이의 이름, 특성, 설명을 포함합니다.
const SNAILS = [
  {
    name: '달퐁이',
    trait: 'STEADY',
    description: '꾸준함: 속도 편차가 적어 안정적입니다.',
  },
  {
    name: '총알탄',
    trait: 'SPRINTER',
    description: '초반 스퍼트: 초반 30% 구간에서 매우 빠릅니다.',
  },
  {
    name: '끈끈이',
    trait: 'RAIN_LOVER',
    description: '진흙길의 강자: 비 오는 날씨에 강합니다.',
  },
  {
    name: '패왕색',
    trait: 'INTIMIDATOR',
    description: '위압감: 가끔 주변 모든 달팽이를 잠시 느려지게 합니다.',
  },
  {
    name: '럭키맨',
    trait: 'LUCKY',
    description: '행운아: 돌발 이벤트의 좋은 효과를 받을 확률이 높습니다.',
  },
];

// 날씨 정보
const WEATHERS = ['맑음', '비'];

// 경주 이벤트 정보
const RACE_EVENTS = [
  {
    name: '산들바람',
    message: '💨 산들바람이 불어 모든 달팽이들이 잠시 빨라집니다!',
    effect: 'SPEED_ALL',
  },
  {
    name: '미끄러운 바닥',
    message: '💧 선두 주자가 미끄러운 바닥을 밟았습니다!',
    effect: 'SLOW_LEADER',
  },
  {
    name: '각성',
    message: '⚡️ 꼴찌 달팽이가 갑자기 각성하여 폭주합니다!',
    effect: 'BOOST_LAST',
  },
  {
    name: '짙은 안개',
    message: '🌫️ 짙은 안개 때문에 모두가 길을 헤맵니다!',
    effect: 'CONFUSION',
  },
];

// 게임 설정값
const RACE_DISTANCE = 100; // 경주 거리 (100m)
const COUNTDOWN_SECONDS = 15; // 경주 시작 전 카운트다운 시간 (초)
const RACE_UPDATE_MS = 100; // 경주 상태 업데이트 주기 (밀리초)
const MAX_PLAYERS_PER_ROOM = 10; // 최대 플레이어 수
const CHAT_HISTORY_MAX_LENGTH = 30; // 채팅 기록 최대 길이

// Node.js의 모듈 시스템을 사용하여 각 상수를 내보냅니다.
export {
  SNAILS,
  WEATHERS,
  RACE_EVENTS,
  RACE_DISTANCE,
  COUNTDOWN_SECONDS,
  RACE_UPDATE_MS,
  MAX_PLAYERS_PER_ROOM,
  CHAT_HISTORY_MAX_LENGTH,
};
