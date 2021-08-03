# IsStudy


## 기획 & 목적
- 코로나 시대로 독서실에서 공부하는것이 부담스러우므로 자택에서 간편하게 다른사람들과 공부할수 있는 환경을 제공하고 순수 공부시간 카운트
- 소켓통신 이해
- typescript 및 nodejs로 백엔드 학습 및 구현


## 주요 기능
- 회원서비스 구현 및 자신의 공부 시간등 회원정보 제공
- zoom처럼 외부 프로그램 설치없이 간편하게 웹 브라우저로 화상 통화 환경 제공
- 자신의 화상 웹캠에서 얼굴이 인식되면 공부시간이 카운트되고 그렇지 않으면 공부시간이 카운트 되지않음


## 구현
### Architecture
![Frame 8](https://user-images.githubusercontent.com/59424336/127957448-9e15ef91-2ee7-44e4-bee7-c743198c033e.png)

### Backend
#### 기술스택
Typescript, Nodejs, socket, Mediasoup, Redis, mysql 

#### 기능
SFU 서버 

#### ERD







### Frontend
체험 : https://ovenapp.io/view/ai8vdOCvluA2BuGBglsDJ4gNdDKXK5t8/ 
 
#### 기술스택
Typescript, React, ReactHook, Webrtc, Mediasoup, socket 

#### 기능
채팅, 화상회의, 얼굴탐지, 시간 
최근 공부시간, 매일 순위 

#### 요소
- Prelogin
- Lobby
- Room
