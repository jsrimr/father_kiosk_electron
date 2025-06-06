const { ipcRenderer } = require('electron');

// 전역 변수
let currentLanguage = 'ko';
let videoStream = null;
let video = null;
let canvas = null;
let ctx = null;
let tmModel = null;
let currentResults = null; // 현재 분석 결과 저장
let mbtiDatabase = null; // MBTI 데이터베이스
let satisfactionRatings = {
    mbti: 0,
    face: 0,
    overall: 0
}; // 만족도 평가 저장
let autoRestartTimer = null; // 자동 재시작 타이머

// 언어별 텍스트
const texts = {
    ko: {
        paymentTitle: '결제를 진행해주세요',
        paymentDescription: 'MBTI 분석 + 20년 후 얼굴 예측',
        cardPayBtn: '카드 결제',
        cashPayBtn: '현금 결제',
        paymentStatus: '결제 처리 중...',
        mainTitle: '얼굴을 촬영해주세요',
        guideText: '얼굴을 가이드 안에 맞춰주세요',
        analysisStatus: 'AI 분석 중...',
        resultTitle: '분석 결과',
        mbtiSectionTitle: '당신의 MBTI',
        partnerSectionTitle: '추천 배우자',
        famousSectionTitle: '대표 유명인',
        surveyTitle: '서비스 만족도 조사',
        mbtiSurveyTitle: 'MBTI 예측 결과에 대한 만족도',
        faceSurveyTitle: '얼굴 예측 결과에 대한 만족도',
        overallSurveyTitle: '전체 서비스 만족도',
        ratePrompt: '평가해주세요',
        ratingLabels: ['매우 불만족', '불만족', '보통', '만족', '매우 만족']
    },
    en: {
        paymentTitle: 'Please proceed with payment',
        paymentDescription: 'MBTI Analysis + 20-year Face Prediction',
        cardPayBtn: 'Card Payment',
        cashPayBtn: 'Cash Payment',
        paymentStatus: 'Processing payment...',
        mainTitle: 'Please take a photo of your face',
        guideText: 'Align your face within the guide',
        analysisStatus: 'AI Analysis in progress...',
        resultTitle: 'Analysis Results',
        mbtiSectionTitle: 'Your MBTI',
        partnerSectionTitle: 'Recommended Partner',
        famousSectionTitle: 'Famous People',
        surveyTitle: 'Service Satisfaction Survey',
        mbtiSurveyTitle: 'MBTI Prediction Satisfaction',
        faceSurveyTitle: 'Face Prediction Satisfaction',
        overallSurveyTitle: 'Overall Service Satisfaction',
        ratePrompt: 'Please rate',
        ratingLabels: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied']
    },
    ja: {
        paymentTitle: 'お支払いを進めてください',
        paymentDescription: 'MBTI分析 + 20年後の顔予測',
        cardPayBtn: 'カード決済',
        cashPayBtn: '現金決済',
        paymentStatus: '決済処理中...',
        mainTitle: '顔写真を撮影してください',
        guideText: 'ガイド内に顔を合わせてください',
        analysisStatus: 'AI分析中...',
        resultTitle: '分析結果',
        mbtiSectionTitle: 'あなたのMBTI',
        partnerSectionTitle: '推奨パートナー',
        famousSectionTitle: '有名人',
        surveyTitle: 'サービス満足度調査',
        mbtiSurveyTitle: 'MBTI予測結果の満足度',
        faceSurveyTitle: '顔予測結果の満足度',
        overallSurveyTitle: '全体的なサービス満足度',
        ratePrompt: '評価してください',
        ratingLabels: ['非常に不満', '不満', '普通', '満足', '非常に満足']
    },
    zh: {
        paymentTitle: '请进行付款',
        paymentDescription: 'MBTI分析 + 20年后面部预测',
        cardPayBtn: '刷卡支付',
        cashPayBtn: '现金支付',
        paymentStatus: '支付处理中...',
        mainTitle: '请拍摄您的面部照片',
        guideText: '请将面部对准指导框',
        analysisStatus: 'AI分析中...',
        resultTitle: '分析结果',
        mbtiSectionTitle: '您的MBTI',
        partnerSectionTitle: '推荐伴侣',
        famousSectionTitle: '名人',
        surveyTitle: '服务满意度调查',
        mbtiSurveyTitle: 'MBTI预测结果满意度',
        faceSurveyTitle: '面部预测结果满意度',
        overallSurveyTitle: '整体服务满意度',
        ratePrompt: '请评价',
        ratingLabels: ['非常不满意', '不满意', '一般', '满意', '非常满意']
    },
    vi: {
        paymentTitle: 'Vui lòng tiến hành thanh toán',
        paymentDescription: 'Phân tích MBTI + Dự đoán khuôn mặt 20 năm sau',
        cardPayBtn: 'Thanh toán thẻ',
        cashPayBtn: 'Thanh toán tiền mặt',
        paymentStatus: 'Đang xử lý thanh toán...',
        mainTitle: 'Vui lòng chụp ảnh khuôn mặt',
        guideText: 'Căn chỉnh khuôn mặt trong khung hướng dẫn',
        analysisStatus: 'Đang phân tích AI...',
        resultTitle: 'Kết quả phân tích',
        mbtiSectionTitle: 'MBTI của bạn',
        partnerSectionTitle: 'Đối tác được đề xuất',
        famousSectionTitle: 'Người nổi tiếng',
        surveyTitle: 'Khảo sát độ hài lòng dịch vụ',
        mbtiSurveyTitle: 'Độ hài lòng về kết quả dự đoán MBTI',
        faceSurveyTitle: 'Độ hài lòng về kết quả dự đoán khuôn mặt',
        overallSurveyTitle: 'Độ hài lòng tổng thể về dịch vụ',
        ratePrompt: 'Vui lòng đánh giá',
        ratingLabels: ['Rất không hài lòng', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Rất hài lòng']
    }
};

// 화면 전환 함수
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showLanguageScreen() {
    showScreen('languageScreen');
    playBackgroundMusic();
}

function selectLanguage(lang) {
    currentLanguage = lang;
    updateTexts();
    showScreen('paymentScreen');
}

function updateTexts() {
    const text = texts[currentLanguage];
    document.getElementById('paymentTitle').textContent = text.paymentTitle;
    document.getElementById('paymentDescription').textContent = text.paymentDescription;
    document.getElementById('cardPayBtn').textContent = text.cardPayBtn;
    document.getElementById('cashPayBtn').textContent = text.cashPayBtn;
    document.getElementById('paymentStatus').textContent = text.paymentStatus;
    document.getElementById('mainTitle').textContent = text.mainTitle;
    document.getElementById('guideText').textContent = text.guideText;
    document.getElementById('analysisStatus').textContent = text.analysisStatus;
    document.getElementById('resultTitle').textContent = text.resultTitle;
    
    // 결과 화면의 섹션 제목들도 업데이트
    const mbtiSectionTitle = document.querySelector('.mbti-result .result-section-title');
    if (mbtiSectionTitle) {
        mbtiSectionTitle.textContent = text.mbtiSectionTitle;
    }
    
    const partnerTitle = document.getElementById('partnerSectionTitle');
    if (partnerTitle) {
        partnerTitle.textContent = text.partnerSectionTitle;
    }
    
    const famousTitle = document.getElementById('famousSectionTitle');
    if (famousTitle) {
        famousTitle.textContent = text.famousSectionTitle;
    }
    
    // 만족도 조사 텍스트 업데이트
    const surveyTitle = document.getElementById('surveyTitle');
    if (surveyTitle) {
        surveyTitle.textContent = text.surveyTitle;
    }
    
    const mbtiSurveyTitle = document.getElementById('mbtiSurveyTitle');
    if (mbtiSurveyTitle) {
        mbtiSurveyTitle.textContent = text.mbtiSurveyTitle;
    }
    
    const faceSurveyTitle = document.getElementById('faceSurveyTitle');
    if (faceSurveyTitle) {
        faceSurveyTitle.textContent = text.faceSurveyTitle;
    }
    
    const overallSurveyTitle = document.getElementById('overallSurveyTitle');
    if (overallSurveyTitle) {
        overallSurveyTitle.textContent = text.overallSurveyTitle;
    }
    
    // 평가 텍스트 초기화
    document.querySelectorAll('.rating-text').forEach(el => {
        el.textContent = text.ratePrompt;
        el.classList.remove('rating-feedback');
    });
}

function playBackgroundMusic() {
    const music = document.getElementById('backgroundMusic');
    music.play().catch(e => console.log('Auto-play blocked'));
}

function processPayment(method) {
    document.getElementById('paymentProgress').style.display = 'block';
    
    // Mock 결제 처리
    setTimeout(() => {
        document.getElementById('paymentProgress').style.display = 'none';
        showScreen('mainScreen');
        loadTMModel();
        loadMBTIDatabase();
    }, 3000);
}

// Teachable Machine 모델 로드
async function loadTMModel() {
    try {
        const TM_URL = "https://teachablemachine.withgoogle.com/models/sW-qqwyNh/";
        tmModel = await tmImage.load(TM_URL + "model.json", TM_URL + "metadata.json");
        console.log('MBTI 모델 로드 완료');
    } catch (error) {
        console.error('MBTI 모델 로드 실패:', error);
    }
}

// MBTI 데이터베이스 로드
async function loadMBTIDatabase() {
    try {
        mbtiDatabase = await ipcRenderer.invoke('load-mbti-data');
        console.log('MBTI 데이터베이스 로드 완료');
    } catch (error) {
        console.error('MBTI 데이터베이스 로드 실패:', error);
    }
}

// 웹캠 관련 함수들
async function toggleCamera() {
    if (videoStream) {
        stopCamera();
    } else {
        await startCamera();
    }
}

async function startCamera() {
    try {
        const constraints = {
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            }
        };
        
        videoStream = await navigator.mediaDevices.getUserMedia(constraints);
        video = document.getElementById('video');
        video.srcObject = videoStream;
        
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 512;
        
        document.getElementById('cameraWrapper').style.display = 'block';
        document.getElementById('cameraBtn').textContent = '웹캠 끄기';
        document.getElementById('captureBtn').style.display = 'inline-block';
        
    } catch (error) {
        console.error('웹캠 접근 실패:', error);
        alert('웹캠에 접근할 수 없습니다.');
    }
}

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    
    document.getElementById('cameraWrapper').style.display = 'none';
    document.getElementById('cameraBtn').textContent = '웹캠 켜기';
    document.getElementById('captureBtn').style.display = 'none';
}

async function captureAndAnalyze() {
    if (!video || !canvas || !ctx) {
        alert('웹캠이 준비되지 않았습니다.');
        return;
    }
    
    document.getElementById('analysisProgress').style.display = 'block';
    
    // 이미지 캡처
    const imageDataUrl = captureImage();
    
    try {
        // MBTI 분석
        let mbtiResult = null;
        if (tmModel) {
            mbtiResult = await analyzeMBTI(imageDataUrl);
        }
        
        // 얼굴 aging 분석
        const faceResult = await analyzeFaceAging(imageDataUrl);
        
        // 결과 표시
        displayResults(mbtiResult, faceResult, imageDataUrl);
        
    } catch (error) {
        console.error('분석 실패:', error);
        alert('분석 중 오류가 발생했습니다.');
        document.getElementById('analysisProgress').style.display = 'none';
    }
}

function captureImage() {
    const videoRect = video.getBoundingClientRect();
    const guideFrame = document.querySelector('.guide-frame');
    const guideRect = guideFrame.getBoundingClientRect();
    
    const scaleX = video.videoWidth / video.offsetWidth;
    const scaleY = video.videoHeight / video.offsetHeight;
    
    const cropX = (guideRect.left - videoRect.left) * scaleX;
    const cropY = (guideRect.top - videoRect.top) * scaleY;
    const cropWidth = guideRect.width * scaleX;
    const cropHeight = guideRect.height * scaleY;
    
    ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, 512, 512);
    
    return canvas.toDataURL('image/jpeg', 0.95);
}

async function analyzeMBTI(imageDataUrl) {
    if (!tmModel) return null;
    
    try {
        const img = new Image();
        img.src = imageDataUrl;
        await new Promise(resolve => img.onload = resolve);
        
        const prediction = await tmModel.predict(img);
        
        // 가장 높은 확률의 MBTI 타입 반환
        let maxProb = 0;
        let mbtiType = 'ENFP';
        
        prediction.forEach(p => {
            if (p.probability > maxProb) {
                maxProb = p.probability;
                mbtiType = p.className;
            }
        });
        
        const mbtiInfo = getMBTIInfo(mbtiType);
        return {
            type: mbtiType,
            confidence: maxProb,
            description: mbtiInfo.description,
            partner: mbtiInfo.partner,
            famous: mbtiInfo.famous
        };
    } catch (error) {
        console.error('MBTI 분석 실패:', error);
        return null;
    }
}

async function analyzeFaceAging(imageDataUrl) {
    try {
        const base64Data = imageDataUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const result = await ipcRenderer.invoke('predict-webcam-age', bytes, 25, 45);
        return result;
    } catch (error) {
        console.error('얼굴 aging 분석 실패:', error);
        throw error;
    }
}

function getMBTIInfo(type) {
    if (!mbtiDatabase) {
        return {
            description: '독특하고 특별한 성격을 가지고 있습니다.',
            partner: '데이터 로딩 중...',
            famous: '데이터 로딩 중...'
        };
    }
    
    // 현재 언어에 맞는 데이터베이스 키 매핑
    const languageMap = {
        'ko': '한국어',
        'en': '영어',
        'ja': '일본어',
        'zh': '중국어',
        'vi': '중국어' // 베트남어 데이터가 없어서 중국어로 대체
    };
    
    const langKey = languageMap[currentLanguage] || '한국어';
    const typeData = mbtiDatabase[langKey] && mbtiDatabase[langKey][type];
    
    if (typeData) {
        return {
            description: typeData.성격 || '독특하고 특별한 성격을 가지고 있습니다.',
            partner: typeData.배우자 || '데이터가 없습니다.',
            famous: typeData.유명인 || '데이터가 없습니다.'
        };
    }
    
    return {
        description: '독특하고 특별한 성격을 가지고 있습니다.',
        partner: '데이터가 없습니다.',
        famous: '데이터가 없습니다.'
    };
}

function displayResults(mbtiResult, faceResult, originalImage) {
    document.getElementById('analysisProgress').style.display = 'none';
    
    // 결과 데이터 저장
    currentResults = {
        timestamp: new Date().toISOString(),
        language: currentLanguage,
        mbti: mbtiResult,
        currentFaceImage: originalImage,
        futureFaceImage: faceResult,
        satisfaction: satisfactionRatings
    };
    
    // MBTI 결과 표시
    if (mbtiResult) {
        document.getElementById('mbtiType').textContent = mbtiResult.type;
        document.getElementById('mbtiDescription').textContent = mbtiResult.description;
        document.getElementById('mbtiPartner').textContent = mbtiResult.partner;
        document.getElementById('mbtiFamous').textContent = mbtiResult.famous;
    }
    
    // 얼굴 이미지 표시
    document.getElementById('currentFace').src = originalImage;
    if (faceResult) {
        document.getElementById('futureFace').src = faceResult;
    }
    
    stopCamera();
    showScreen('resultScreen');
    initSatisfactionSurvey();
    startAutoRestartTimer();
}

// 만족도 조사 초기화
function initSatisfactionSurvey() {
    // 모든 별점을 초기화
    document.querySelectorAll('.star').forEach(star => {
        star.classList.remove('active');
        star.addEventListener('click', handleStarClick);
    });
    
    // 만족도 평가 초기화
    satisfactionRatings = {
        mbti: 0,
        face: 0,
        overall: 0
    };
    
    // 평가 텍스트 초기화
    const text = texts[currentLanguage];
    document.querySelectorAll('.rating-text').forEach(el => {
        el.textContent = text.ratePrompt;
        el.classList.remove('rating-feedback');
    });
}

// 별점 클릭 처리
function handleStarClick(event) {
    const star = event.target;
    const ratingContainer = star.parentElement;
    const category = ratingContainer.dataset.category;
    const rating = parseInt(star.dataset.rating);
    
    // 해당 카테고리의 별점 업데이트
    const stars = ratingContainer.querySelectorAll('.star');
    stars.forEach((s, index) => {
        if (index < rating) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });
    
    // 만족도 점수 저장
    satisfactionRatings[category] = rating;
    
    // 피드백 텍스트 표시
    const text = texts[currentLanguage];
    const ratingText = ratingContainer.nextElementSibling;
    ratingText.textContent = text.ratingLabels[rating - 1];
    ratingText.classList.add('rating-feedback');
    
    console.log(`${category} 만족도: ${rating}점`);
}

// 자동 재시작 타이머 시작 (5분 = 300초)
function startAutoRestartTimer() {
    clearAutoRestartTimer(); // 기존 타이머 제거
    
    autoRestartTimer = setTimeout(() => {
        console.log('5분 비활성으로 인한 자동 재시작');
        startOver();
    }, 5 * 60 * 1000); // 5분
}

// 자동 재시작 타이머 제거
function clearAutoRestartTimer() {
    if (autoRestartTimer) {
        clearTimeout(autoRestartTimer);
        autoRestartTimer = null;
    }
}

function startOver() {
    // 자동 재시작 타이머 제거
    clearAutoRestartTimer();
    
    // 모든 상태 초기화
    stopCamera();
    document.getElementById('backgroundMusic').pause();
    
    // 결과 데이터 초기화
    currentResults = null;
    satisfactionRatings = {
        mbti: 0,
        face: 0,
        overall: 0
    };
    
    // 언어를 기본값으로 초기화
    currentLanguage = 'ko';
    
    // 모든 진행 상태 숨기기
    document.getElementById('paymentProgress').style.display = 'none';
    document.getElementById('analysisProgress').style.display = 'none';
    
    // 웹캠 관련 버튼 초기화
    document.getElementById('cameraBtn').textContent = '웹캠 켜기';
    document.getElementById('captureBtn').style.display = 'none';
    document.getElementById('cameraWrapper').style.display = 'none';
    
    // 만족도 조사 별점 초기화
    document.querySelectorAll('.star').forEach(star => {
        star.classList.remove('active');
    });
    document.querySelectorAll('.rating-text').forEach(el => {
        el.textContent = '평가해주세요';
        el.classList.remove('rating-feedback');
    });
    
    // 시작 화면으로 돌아가기
    showScreen('startScreen');
    
    console.log('키오스크가 초기 상태로 초기화되었습니다.');
}

async function saveResults() {
    if (!currentResults) {
        alert('저장할 결과가 없습니다.');
        return;
    }
    
    try {
        const result = await ipcRenderer.invoke('save-results', currentResults);
        
        if (result.success) {
            alert(result.message);
            console.log('저장된 파일들:', result.savedFiles);
        } else {
            alert('저장에 실패했습니다.');
        }
    } catch (error) {
        console.error('결과 저장 실패:', error);
        alert('저장 중 오류가 발생했습니다: ' + error.message);
    }
}

// 초기화
window.addEventListener('DOMContentLoaded', () => {
    console.log('키오스크 애플리케이션 시작');
}); 