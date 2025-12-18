<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Flash Delivery (React + PHP)

로컬에서 PHP 백엔드(API)와 React 프론트를 함께 실행하는 최소 가이드입니다.

## 환경 변수
- `.env.local`의 `VITE_API_BASE_URL`을 백엔드 주소로 설정하세요. (기본: `http://localhost:8000`)
- `.env.local`의 `VITE_DESIGN_MODE`를 `true`로 두면 UI가 자체 mock 데이터를 불러옵니다. 백엔드를 연결하고 싶으면 `false`로 바꿔주세요.
- `.env.local`의 `VITE_GOOGLE_MAPS_API_KEY`에 Google Maps Places API 키를 넣으면 주소 자동완성 기능이 정상적으로 동작하며, 키가 없거나 Google 요청이 실패하면 OpenStreetMap Nominatim 기반의 대체 검색을 사용합니다.
- 백엔드 관리자 비밀번호는 `ADMIN_PASSWORD` 환경 변수로 설정 가능합니다. (기본값: `changeme123`)

## 백엔드(PHP) 실행
```
php -S 0.0.0.0:8000 backend/index.php
```

## 프론트엔드(React) 실행
```
npm install
npm run dev
```
