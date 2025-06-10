const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 개발 환경에서 자동 리로드 활성화
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (e) {
    console.log('electron-reload not available');
  }
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools(); // 개발자 도구 활성화
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Python 스크립트 직접 사용 (개발 환경)
ipcMain.handle('predict-age', async (event, imagePath, sourceAge = 25, targetAge = 45) => {
  console.log('IPC Handler called with:', { imagePath, sourceAge, targetAge });
  
  const { spawn } = require('child_process');
  
  return new Promise((resolve, reject) => {
    // Python 스크립트 직접 실행
    const pythonPath = '/Users/jungsublim/miniconda3/envs/face/bin/python';
    const scriptPath = path.join(__dirname, 'face_reaging', 'scripts', 'predict.py');
    
    console.log('Using Python script:', { pythonPath, scriptPath, imagePath, sourceAge, targetAge });
    
    const child = spawn(pythonPath, [scriptPath, imagePath, sourceAge.toString(), targetAge.toString()], {
      cwd: path.join(__dirname, 'face_reaging')
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log('Python script completed successfully');
        console.log('Result:', stdout.trim());
        resolve(stdout.trim());
      } else {
        console.error('Python script error:', stderr);
        reject(new Error(stderr));
      }
    });
  });
});

// 웹캠 이미지 처리를 위한 Python 스크립트 IPC 핸들러  
ipcMain.handle('predict-webcam-age', async (event, imageBlob, sourceAge = 25, targetAge = 45) => {
  console.log('Webcam IPC Handler called with:', { sourceAge, targetAge });
  
  const { spawn } = require('child_process');
  
  return new Promise((resolve, reject) => {
    // Buffer를 임시 파일로 저장
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    const tempImagePath = path.join(tempDir, `webcam_${Date.now()}.jpg`);
    
    // imageBlob을 Buffer로 변환하여 파일로 저장
    const buffer = Buffer.from(imageBlob);
    fs.writeFile(tempImagePath, buffer, (err) => {
      if (err) {
        console.error('임시 파일 저장 실패:', err);
        reject(err);
        return;
      }
      
      // Python 스크립트 직접 실행
      const pythonPath = '/Users/jungsublim/miniconda3/envs/face/bin/python';
      const scriptPath = path.join(__dirname, 'face_reaging', 'scripts', 'predict.py');
      
      console.log('Using Python script for webcam:', { pythonPath, scriptPath, tempImagePath, sourceAge, targetAge });
      
      const child = spawn(pythonPath, [scriptPath, tempImagePath, sourceAge.toString(), targetAge.toString()], {
        cwd: path.join(__dirname, 'face_reaging')
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        // 임시 파일 정리
        fs.unlink(tempImagePath, (unlinkErr) => {
          if (unlinkErr) console.error('임시 파일 삭제 실패:', unlinkErr);
        });
        
        if (code === 0) {
          console.log('Python script completed successfully for webcam');
          console.log('Result:', stdout.trim());
          resolve(stdout.trim());
        } else {
          console.error('Python script error for webcam:', stderr);
          reject(new Error(stderr));
        }
      });
    });
  });
});

// 결과 저장을 위한 IPC 핸들러
ipcMain.handle('save-results', async (event, resultData) => {
  console.log('Save results handler called');
  
  return new Promise((resolve, reject) => {
    // 저장할 폴더 생성
    const saveDir = path.join(__dirname, 'saved_results');
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }
    
    // 현재 시간으로 파일명 생성
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `result_${timestamp}`;
    
    try {
      // JSON 결과 저장
      const jsonPath = path.join(saveDir, `${fileName}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(resultData, null, 2));
      
      // 만족도 조사 결과를 별도 CSV 파일에 추가 저장
      if (resultData.satisfaction) {
        const csvPath = path.join(saveDir, 'satisfaction_survey.csv');
        const csvExists = fs.existsSync(csvPath);
        
        // CSV 헤더 (파일이 없을 때만)
        if (!csvExists) {
          const header = 'timestamp,language,mbti_type,mbti_satisfaction,face_satisfaction,overall_satisfaction\n';
          fs.writeFileSync(csvPath, header);
        }
        
        // CSV 데이터 추가
        const csvRow = [
          resultData.timestamp,
          resultData.language,
          resultData.mbti ? resultData.mbti.type : 'N/A',
          resultData.satisfaction.mbti,
          resultData.satisfaction.face,
          resultData.satisfaction.overall
        ].join(',') + '\n';
        
        fs.appendFileSync(csvPath, csvRow);
      }
      
      // 현재 얼굴 이미지 저장
      if (resultData.currentFaceImage) {
        const currentImagePath = path.join(saveDir, `${fileName}_current.jpg`);
        const currentImageData = resultData.currentFaceImage.replace(/^data:image\/jpeg;base64,/, '');
        fs.writeFileSync(currentImagePath, currentImageData, 'base64');
      }
      
      // 미래 얼굴 이미지 저장
      if (resultData.futureFaceImage) {
        const futureImagePath = path.join(saveDir, `${fileName}_future.jpg`);
        const futureImageData = resultData.futureFaceImage.replace(/^data:image\/jpeg;base64,/, '');
        fs.writeFileSync(futureImagePath, futureImageData, 'base64');
      }
      
      resolve({
        success: true,
        message: `결과가 저장되었습니다: ${saveDir}`,
        savedFiles: {
          json: jsonPath,
          currentImage: resultData.currentFaceImage ? path.join(saveDir, `${fileName}_current.jpg`) : null,
          futureImage: resultData.futureFaceImage ? path.join(saveDir, `${fileName}_future.jpg`) : null
        }
      });
      
    } catch (error) {
      console.error('결과 저장 실패:', error);
      reject(error);
         }
   });
 });

// MBTI 데이터베이스 로드를 위한 IPC 핸들러
ipcMain.handle('load-mbti-data', async (event) => {
  console.log('Loading MBTI database');
  
  try {
    const dbPath = path.join(__dirname, 'db.json');
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('MBTI 데이터베이스 로드 실패:', error);
    throw error;
  }
});