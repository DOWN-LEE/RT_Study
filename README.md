# RT_Study


## Planning reason and purpose
- Studying in the reading room is burdensome in the Corona era, so i provide an environment where users can easily study with others at home and count pure study time
- To understanding socket communication
- Study and implement backend with typescript and nodejs


## Main function
- 회원서비스 구현 및 자신의 공부 시간등 회원정보 제공
- zoom처럼 외부 프로그램 설치없이 간편하게 웹 브라우저로 화상 통화 환경 제공
- 자신의 화상 웹캠에서 얼굴이 인식되면 공부시간이 카운트되고 그렇지 않으면 공부시간이 카운트 되지않음


## Implement
### Architecture
![Frame 8](https://user-images.githubusercontent.com/59424336/127957448-9e15ef91-2ee7-44e4-bee7-c743198c033e.png)

### Backend
#### tech stack
Typescript, Nodejs, socket, Mediasoup, Redis, mysql 

#### function
SFU server

#### ERD







### Frontend
체험 : 
 
#### tech stack
Typescript, React, ReactHook, Webrtc, Mediasoup, socket, tensorflowJS

#### function
채팅, 화상회의, 얼굴탐지, 시간 
최근 공부시간, 매일 순위 

#### 요소
- Prelogin
- Lobby
- Room
