/**
 * @file dom.js
 * HTML 문서의 모든 DOM 요소를 선택하고 내보내는 모듈입니다.
 */

export const lobbyView = document.getElementById('lobby-view');
export const gameView = document.getElementById('game-view');
export const roomNameInput = document.getElementById('room-name-input');
export const createRoomBtn = document.getElementById('create-room-btn');
export const roomList = document.getElementById('room-list');
export const leaveRoomBtn = document.getElementById('leave-room-btn');
export const headerRoomName = document.getElementById('header-room-name');

export const canvas = document.getElementById('race-canvas');
export const ctx = canvas.getContext('2d');
export const countdownEl = document.getElementById('countdown');
export const raceStatusEl = document.getElementById('race-status-container');
export const raceStatusTextEl = document.getElementById('race-status-text');
export const snailSelect = document.getElementById('snail-select');
export const betButton = document.getElementById('bet-button');
export const betAmountInput = document.getElementById('bet-amount');
export const nicknameInput = document.getElementById('nickname-input');
export const nicknameButton = document.getElementById('nickname-button');
export const chatMessages = document.getElementById('chat-messages');
export const chatInput = document.getElementById('chat-input');
export const chatButton = document.getElementById('chat-button');
export const leaderboardList = document.getElementById('leaderboard');
export const weatherIconEl = document.getElementById('weather-icon');
export const weatherTextEl = document.getElementById('weather-text');
export const oddsListEl = document.getElementById('odds-list');
export const eventBannerEl = document.getElementById('event-banner');
export const myPointsEl = document.getElementById('my-points');

export const myBetStatusEl = document.getElementById('my-bet-status');
export const myBetTextEl = document.getElementById('my-bet-text');
