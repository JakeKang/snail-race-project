/**
 * @file client.js
 * 클라이언트 측 메인 스크립트 파일입니다.
 * 각 모듈을 가져와 초기화하고 전체 애플리케이션을 실행합니다.
 */

// UI, DOM 이벤트, 소켓 이벤트 모듈을 가져옵니다.
import * as ui from './modules/ui.js';
import {
  initializeDomEventListeners,
  initializeSocketEventListeners,
} from './modules/events.js';

// 소켓 서버에 연결합니다.
// HTML에 포함된 /socket.io/socket.io.js 덕분에 'io'는 전역에서 사용 가능합니다.
const socket = io();

// 1. 서버로부터 오는 소켓 이벤트를 처리하도록 설정합니다.
initializeSocketEventListeners(socket);

// 2. 사용자의 클릭 등 DOM 이벤트를 처리하도록 설정합니다.
initializeDomEventListeners(socket);

// 3. 애플리케이션의 첫 화면으로 로비를 표시합니다.
ui.showView('lobby');
