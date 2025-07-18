# 🐌 달팽이 경마 (Snail Race)

**Node.js와 Socket.IO 기반의 실시간 멀티플레이어 웹 베팅 게임**

<br>

![Snail Race Gameplay](https://user-images.githubusercontent.com/사용자ID/저장소ID/SnailRace.gif)
_(LICEcap, ScreenToGif 등의 툴을 사용하여 실제 게임 플레이 GIF를 녹화하고 이 이미지를 교체하세요.)_

<br>

## 📜 프로젝트 소개 (About)

`Snail Race`는 "달팽이 경마 사이트를 만들어줘"라는 한 문장의 아이디어에서 출발하여, 실제 서비스 운영까지 고려한 풀스택 웹 애플리케이션입니다. 사용자들은 로비에서 다른 플레이어들과 함께 게임방을 만들거나 참가할 수 있습니다. 각 경주마다 변하는 날씨와 달팽이들의 고유한 특성, 실시간 배당률을 보며 전략적으로 베팅하고, 돌발 이벤트를 겪으며 짜릿한 경주를 즐길 수 있습니다.

이 프로젝트는 개발자의 기획과 감독 하에 Gemini 2.5 Pro가 기술 구현 파트너로 참여하여, 아이디어 구상부터 최종 배포 준비까지 전 과정을 진행한 인간-AI 협업 프로젝트입니다.

<br>

## ✨ 주요 기능 (Features)

- **🏠 실시간 로비 시스템**: 방을 만들거나 기존 방에 참가하여 다른 유저들과 함께 플레이
- **🌐 풀스택 멀티플레이어**: Node.js와 Socket.IO를 이용한 실시간 상태 동기화
- **🎲 동적 게임 요소**: 각기 다른 특성을 가진 달팽이, 경주에 영향을 미치는 날씨, 예측 불가능한 돌발 이벤트
- **📊 실시간 베팅 시스템**: 유저들의 베팅 현황에 따라 실시간으로 변동하는 동적 배당률 및 나의 베팅 현황 UI
- **💬 상호작용 기능**: 방 안의 다른 플레이어들과의 실시간 채팅(채팅 기록 포함) 및 포인트 기반 리더보드
- **🛠️ 모듈화 아키텍처**: 유지보수 및 확장을 고려한 서버/클라이언트 코드의 기능별 모듈화
- **📱 반응형 디자인**: 데스크톱과 모바일 환경 모두에서 최적화된 UI 제공
- **🚀 운영 안정성**: PM2를 통한 프로세스 관리, 오류 발생 시 자동 복구 및 전역 에러 핸들링

<br>

## 🛠️ 기술 스택 (Tech Stack)

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![PM2](https://img.shields.io/badge/PM2-2B037A?style=for-the-badge&logo=pm2&logoColor=white)

<br>

## 🚀 시작하기 (Getting Started)

```bash
# 1. 프로젝트 클론
git clone [저장소 주소]

# 2. 프로젝트 폴더로 이동
cd snail-race-project

# 3. 필요한 패키지 설치
npm install

# 4. 서버 실행 (개발용)
node server.js

# 5. 서버 실행 (운영/배포용)
# pm2가 설치되어 있어야 합니다: npm install pm2 -g
pm2 start server.js --name "snail-race"

# 6. 브라우저에서 http://localhost:3000 으로 접속
```

<br>

## 📁 프로젝트 구조 (Project Structure)

```
.
├── server.js               # 서버 실행 및 모듈 총괄
├── package.json
├── .env                    # 환경 변수 설정 파일 (로그 활성화 등)
├── /game-modules/          # 서버 로직 모듈
│   ├── constants.js
│   ├── state.js
│   ├── room-manager.js
│   ├── game-logic.js
│   ├── game-loop.js
│   └── logger.js
└── /public/                # 클라이언트 파일
    ├── index.html
    ├── style.css
    ├── client.js           # 클라이언트 모듈 총괄
    └── /modules/           # 클라이언트 로직 모듈
        ├── dom.js
        ├── ui.js
        └── events.js
```

<br>

## 📄 라이선스 (License)

This project is licensed under the MIT License.
