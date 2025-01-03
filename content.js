// content.js
let isSelecting = false;
let startX, startY;
let overlay, selection;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startSelection") {
    startAreaSelection();
  }
  else if (request.action === "cropScreenshot") {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const dpr = request.area.devicePixelRatio || 1;
      
      canvas.width = request.area.width;
      canvas.height = request.area.height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        img,
        request.area.x * dpr,
        request.area.y * dpr,
        request.area.width * dpr,
        request.area.height * dpr,
        0,
        0,
        request.area.width,
        request.area.height
      );
      
      sendResponse({ croppedImage: canvas.toDataURL() });
    };
    img.src = request.imageData;
    return true;
}
  return true;
});


function startAreaSelection() {
// 반투명 오버레이 생성
  overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.3);
    cursor: crosshair;
    z-index: 999999;
  `;
  
  //선택 영역을 보여줄 div 생성
  selection = document.createElement('div');
  selection.style.cssText = `
    position: fixed;
    border: 2px solid #fff;
    background: rgba(255,255,255,0.1);
    display: none;
    z-index: 999999;
  `;
  
  //DOM에 추가
  document.body.appendChild(overlay);
  document.body.appendChild(selection);
  
  // 마우스 이벤트 리스너 설정
  overlay.addEventListener('mousedown', startDrag);
  overlay.addEventListener('mousemove', updateSelection);
  overlay.addEventListener('mouseup', endSelection);
}

function startDrag(e) {
  isSelecting = true;
  startX = e.clientX;
  startY = e.clientY;
  selection.style.display = 'block';
}

function updateSelection(e) {
  if (!isSelecting) return;
  
  const currentX = e.clientX;
  const currentY = e.clientY;
  
  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  
  selection.style.left = left + 'px';
  selection.style.top = top + 'px';
  selection.style.width = width + 'px';
  selection.style.height = height + 'px';
}

function endSelection() {
  isSelecting = false;
  const rect = selection.getBoundingClientRect();
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  
  chrome.runtime.sendMessage({
    action: "capture",
    area: {
      x: rect.left + scrollX,
      y: rect.top + scrollY,
      width: rect.width,
      height: rect.height,
      devicePixelRatio: window.devicePixelRatio
    }
  }, function(response) {
    if (response && response.imageData) {
        chrome.runtime.sendMessage({
            action: "updateCapturedImage",
            imageData: response.imageData
        });
    }
  });
  document.body.removeChild(overlay);
  document.body.removeChild(selection);
}
