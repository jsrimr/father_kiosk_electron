# 🎭 MBTI & Face Aging Prediction Kiosk

An interactive kiosk application that combines MBTI personality analysis with AI-powered face aging prediction. Users can discover their personality type and see how they might look in 20 years!

## 📱 주요 기능

### 🎯 핵심 서비스
- **MBTI 성격 분석**: Teachable Machine을 활용한 실시간 얼굴 인식 기반 MBTI 예측
- **얼굴 노화 예측**: AI 모델을 통한 20년 후 얼굴 모습 시뮬레이션
- **다국어 지원**: 한국어, 영어, 일본어, 중국어, 베트남어 지원
- **만족도 조사**: 서비스 품질 개선을 위한 사용자 피드백 수집

### 🖥️ 키오스크 화면 구성
1. **시작 화면**: 서비스 소개 및 시작 버튼
2. **언어 선택**: 5개 언어 중 선택 (배경 음악 포함)
3. **결제 화면**: 모의 결제 시스템 (₩5,000)
4. **촬영 화면**: 웹캠을 통한 얼굴 촬영 및 AI 분석
5. **결과 화면**: MBTI 결과, 얼굴 예측, 만족도 조사

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Electron (Node.js)
- **AI/ML**: 
  - Teachable Machine (MBTI 예측)
  - Custom Face Aging Model
- **UI/UX**: 
  - 반응형 디자인
  - CSS 애니메이션 및 그라데이션
  - 다국어 지원 시스템

## 📦 설치 및 실행

### 필수 요구사항
- Node.js (v14 이상)
- Python 3.7+ (얼굴 노화 예측을 위함)
- npm 또는 yarn
- 웹캠이 연결된 컴퓨터
- CUDA (선택사항, GPU 가속을 위해)

### 설치 방법

1. **저장소 클론 (submodule 포함)**
```bash
git clone --recurse-submodules <repository-url>
cd father-kiosk-electron

# 이미 클론한 경우 submodule 초기화
git submodule update --init --recursive
```

2. **Node.js 의존성 설치**
```bash
npm install
```

3. **Python 의존성 및 face_reaging 패키지 설치**
```bash
# Python 가상환경 생성 (권장)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 또는
venv\Scripts\activate     # Windows

# PyTorch 설치 (CPU 버전)
pip install torch torchvision

# PyTorch 설치 (GPU 버전, CUDA가 설치된 경우)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# face_reaging 패키지 의존성 설치
pip install antialiased_cnns lpips face_recognition ffmpy av gradio opencv-python pillow numpy
```

4. **face_reaging 모델 파일 준비**
```bash
# face_reaging는 git submodule로 관리됩니다
# 메인 모델 파일은 용량이 크므로 별도 다운로드가 필요합니다

# 필요한 모델 파일:
# - face_reaging/best_unet_model.pth (119MB, 별도 다운로드 필요)
# - face_reaging/assets/mask1024.jpg (submodule에 포함)
# - face_reaging/assets/mask512.jpg (submodule에 포함)

# 모델 파일 다운로드 (별도 제공)
# 또는 프로젝트 담당자에게 best_unet_model.pth 파일 요청
```

5. **애플리케이션 실행**
```bash
npm start
```

### 개발 모드 실행
```bash
npm run dev
```

## 🎮 사용 방법

### 기본 사용 흐름

1. **앱 시작**: `npm start` 실행 후 키오스크 화면 시작
2. **언어 선택**: 원하는 언어의 국기 클릭
3. **결제 진행**: START 버튼으로 모의 결제 완료
4. **얼굴 촬영**: 
   - 웹캠 권한 허용
   - 얼굴 가이드에 맞춰 촬영
   - 캡처 버튼 클릭
5. **결과 확인**: 
   - MBTI 분석 결과 확인
   - 20년 후 얼굴 예측 확인
   - 만족도 평가 (1-5점)
6. **결과 저장**: 선택적으로 결과 저장

### 키보드 단축키
- `ESC`: 이전 화면으로 돌아가기
- `SPACE`: 사진 촬영 (촬영 화면에서)
- `ENTER`: 다음 단계 진행

## 📁 프로젝트 구조

```
father-kiosk-electron/
├── main.js                 # Electron 메인 프로세스
├── index.html             # 기본 진입점
├── kiosk.html            # 키오스크 메인 화면
├── package.json          # 프로젝트 설정
├── face_reaging/         # 얼굴 노화 예측 모델 (git submodule)
│   ├── best_unet_model.pth # 메인 모델 파일 (별도 다운로드)
│   ├── assets/
│   │   ├── mask1024.jpg  # 마스크 파일
│   │   └── mask512.jpg   # 마스크 파일
│   ├── utils/            # 유틸리티 함수들
│   ├── model/            # 모델 아키텍처
│   └── scripts/          # 원본 스크립트들
├── custom_scripts/       # 프로젝트별 커스텀 스크립트
│   ├── predict.py        # 커스텀 예측 스크립트
│   └── test_functions.py # 수정된 테스트 함수들
├── static/
│   ├── css/
│   │   └── kiosk.css     # 스타일시트
│   ├── js/
│   │   └── kiosk.js      # 메인 로직
│   └── audio/
│       └── fast_beat.mp3 # 배경 음악
├── saved_results/        # 결과 저장 폴더
│   ├── result_*.json     # 개별 결과 파일
│   └── satisfaction_survey.csv # 만족도 조사 데이터
├── venv/                 # Python 가상환경 (생성 후)
└── README.md
```

## 📊 데이터 저장 형식

### 개별 결과 JSON
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "language": "ko",
  "mbti": {
    "type": "ENFP",
    "description": "재기발랄한 활동가",
    "traits": ["외향적", "직관적", "감정적", "인식적"],
    "compatibility": "INTJ",
    "celebrities": ["로버트 다우니 주니어", "엘렌 드제너러스"]
  },
  "currentFaceImage": "data:image/jpeg;base64,...",
  "futureFaceImage": "data:image/jpeg;base64,...",
  "satisfaction": {
    "mbti": 4,
    "face": 5,
    "overall": 4
  }
}
```

### 만족도 조사 CSV
```csv
timestamp,language,mbti_type,mbti_satisfaction,face_satisfaction,overall_satisfaction
2024-01-15T10:30:00.000Z,ko,ENFP,4,5,4
2024-01-15T10:35:00.000Z,en,ISTJ,3,4,4
```

## 🌍 다국어 지원

| 언어 | 코드 | 상태 |
|------|------|------|
| 한국어 | `ko` | ✅ 완료 |
| English | `en` | ✅ 완료 |
| 日本語 | `ja` | ✅ 완료 |
| 中文 | `zh` | ✅ 완료 |
| Tiếng Việt | `vi` | ✅ 완료 |

## 🎨 UI/UX 특징

- **모던 디자인**: 그라데이션과 부드러운 애니메이션
- **반응형 레이아웃**: 다양한 화면 크기 지원
- **접근성**: 직관적인 아이콘과 명확한 시각적 피드백
- **키오스크 최적화**: 터치 인터페이스 친화적

## 🤖 AI 모델 정보

### MBTI 예측 모델
- **플랫폼**: Teachable Machine (Google)
- **모델 URL**: `https://teachablemachine.withgoogle.com/models/sW-qqwyNh/`
- **입력**: 웹캠을 통한 실시간 이미지
- **출력**: 16가지 MBTI 유형 중 하나

### 얼굴 노화 예측
- **기능**: 현재 얼굴에서 20년 후 모습 예측
- **모델**: face_reaging 패키지 (PyTorch 기반)
- **처리**: Python 백엔드 → IPC 통신 → Electron 프론트엔드
- **요구사항**: 
  - Python 3.7+
  - PyTorch
  - 필수 모델 파일: `best_unet_model.pth`
  - 마스크 파일: `mask1024.jpg`, `mask512.jpg`

## 📈 만족도 조사 시스템

### 조사 항목
1. **MBTI 예측 만족도** (1-5점)
2. **얼굴 예측 만족도** (1-5점)
3. **전체 서비스 만족도** (1-5점)

### 데이터 활용
- 서비스 품질 개선 지표
- 사용자 경험 분석
- A/B 테스트 기반 데이터

## 🔧 개발 환경 설정

### 개발 도구
```bash
# 개발 의존성 설치
npm install --save-dev electron

# 빌드 도구 (선택사항)
npm install --save-dev electron-builder
```

### 환경 변수
```bash
# .env 파일 생성 (선택사항)
NODE_ENV=development
DEBUG=true
```

## 🚀 배포

### Electron 앱 빌드
```bash
npm run build
```

### 키오스크 모드 실행
```bash
npm run kiosk
```

## 📦 Submodule 관리

이 프로젝트는 `face_reaging`을 git submodule로 사용합니다.

### Submodule 업데이트
```bash
# submodule 최신 버전으로 업데이트
git submodule update --remote face_reaging

# 변경사항 커밋
git add face_reaging
git commit -m "Update face_reaging submodule"
```

### Submodule 초기화 (기존 클론에서)
```bash
git submodule update --init --recursive
```

### Submodule 상태 확인
```bash
git submodule status
```

## 🔧 문제 해결

### face_reaging 관련 문제

**모델 파일이 없는 경우**
```bash
# face_reaging 리포지토리에서 필요한 파일 다운로드
# 또는 프로젝트 담당자에게 모델 파일 요청
```

**Python 모듈을 찾을 수 없는 경우**
```bash
# Python 경로 확인
which python
python --version

# 가상환경 활성화 확인
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 의존성 재설치
pip install -r requirements.txt  # requirements.txt가 있는 경우
```

**CUDA 관련 오류**
```bash
# CPU 버전으로 PyTorch 재설치
pip uninstall torch torchvision
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

**얼굴 인식 실패**
- 조명이 충분한지 확인
- 얼굴이 가이드 프레임 안에 있는지 확인
- 웹캠 권한이 허용되었는지 확인

## 🤝 기여 방법

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의 및 지원

- **이슈 리포트**: GitHub Issues
- **기능 요청**: GitHub Discussions
- **기술 지원**: 개발팀 연락처

---

Made with ❤️ for interactive kiosk experiences 