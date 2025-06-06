import sys
import os
import torch
import numpy as np
from PIL import Image
import base64
from io import BytesIO

# face_reaging 모듈들을 import하기 위해 경로 추가
project_root = os.path.dirname(os.path.dirname(__file__))
face_reaging_path = os.path.join(project_root, 'face_reaging')
sys.path.append(face_reaging_path)

# test_functions.py를 직접 import
import importlib.util
spec = importlib.util.spec_from_file_location("test_functions", os.path.join(os.path.dirname(__file__), "test_functions.py"))
test_functions = importlib.util.module_from_spec(spec)
spec.loader.exec_module(test_functions)

from model.models import UNet

# 모델 경로 설정
model_path = os.path.join(face_reaging_path, 'best_unet_model.pth')

def load_model():
    """모델을 로드하고 반환합니다."""
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    unet_model = UNet().to(device)
    unet_model.load_state_dict(torch.load(model_path, map_location=device))
    unet_model.eval()
    return unet_model

def predict_aging(image_path, source_age=25, target_age=45):
    """
    이미지의 나이를 예측합니다.
    
    Args:
        image_path: 입력 이미지 경로
        source_age: 현재 나이 (기본값: 25)
        target_age: 목표 나이 (기본값: 45, 20년 후)
    
    Returns:
        base64 인코딩된 결과 이미지
    """
    try:
        # 이미지 파일 존재 확인
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found: {image_path}")
        
        print(f"Processing image: {image_path}", file=sys.stderr)
        print(f"Source age: {source_age}, Target age: {target_age}", file=sys.stderr)
        
        # dlib 경고 무시 (M1 Mac 호환성)
        import warnings
        warnings.filterwarnings("ignore", message=".*AVX.*")
        
        # 모델 로드
        print("Loading model...", file=sys.stderr)
        model = load_model()
        print("Model loaded successfully", file=sys.stderr)
        
        # 이미지 로드
        print("Loading image...", file=sys.stderr)
        image = Image.open(image_path).convert('RGB')
        print(f"Image size: {image.size}", file=sys.stderr)
        
        # 이미지 크기 확인 및 조정
        if image.size[0] < 256 or image.size[1] < 256:
            print("Image too small, resizing...", file=sys.stderr)
            image = image.resize((512, 512), Image.Resampling.LANCZOS)
        
        # 기본 설정값
        window_size = 512
        stride = 256
        
        # 예측 수행 (process_image 함수 사용)
        print("Starting face processing...", file=sys.stderr)
        aged_image = test_functions.process_image(
            model, 
            image, 
            video=False, 
            source_age=source_age,
            target_age=target_age, 
            window_size=window_size, 
            stride=stride
        )
        print("Face processing completed", file=sys.stderr)
        
        # 결과 이미지를 base64로 인코딩
        print("Encoding result image...", file=sys.stderr)
        buffered = BytesIO()
        aged_image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        print("Result encoding completed", file=sys.stderr)
        
        return f"data:image/png;base64,{img_str}"
    
    except ValueError as e:
        # 얼굴 감지 실패 등의 알려진 에러
        if "No face detected" in str(e):
            print(f"Face detection failed: {str(e)}", file=sys.stderr)
            print("Tips for better face detection:", file=sys.stderr)
            print("- Ensure good lighting", file=sys.stderr)
            print("- Face should be clearly visible and not partially covered", file=sys.stderr)
            print("- Try a different image angle", file=sys.stderr)
        else:
            print(f"Error in predict_aging: {str(e)}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error in predict_aging: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2 or len(sys.argv) > 4:
        print("Usage: python predict.py <image_path> [source_age] [target_age]", file=sys.stderr)
        sys.exit(1)
    
    image_path = sys.argv[1]
    source_age = int(sys.argv[2]) if len(sys.argv) > 2 else 25
    target_age = int(sys.argv[3]) if len(sys.argv) > 3 else 45
    
    result = predict_aging(image_path, source_age, target_age)
    print(result) 