// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];
let cycloneSound, jokerSound, heatSound, lunaSound, metalSound, triggerSound, changeSound; // 新增變數

// 組合音樂變數
let soundCJ, soundCM, soundCT, soundHJ, soundHM, soundHT, soundLJ, soundLM, soundLT;
let lastComboTouch = false;

// 顏色陣列與索引
const leftColors = [
  [0, 255, 0],   // 綠色
  [255, 0, 0],   // 紅色
  [255, 255, 0]  // 黃色
];
const rightColors = [
  [200, 0, 200],   // 紫色
  [223, 223, 223], // 淺灰
  [0, 0, 255]      // 藍色
];

// 顏色對應音樂
let leftColorSounds = [];
let rightColorSounds = [];

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipped: true });
  // 載入音樂
  cycloneSound = loadSound('music/cyclone.mp3');
  heatSound = loadSound('music/heat.mp3');
  lunaSound = loadSound('music/luna.mp3');
  jokerSound = loadSound('music/joker.mp3');
  metalSound = loadSound('music/metal.mp3');
  triggerSound = loadSound('music/trigger.mp3');
  changeSound = loadSound('music/change.mp3'); // 載入切換音樂

  // 左手顏色對應音樂
  leftColorSounds = [cycloneSound, heatSound, lunaSound];
  // 右手顏色對應音樂
  rightColorSounds = [jokerSound, metalSound, triggerSound];

  // 載入音樂
  soundCJ = loadSound('music/CJ.mp3');
  soundCM = loadSound('music/CM.mp3');
  soundCT = loadSound('music/CT.mp3');
  soundHJ = loadSound('music/HJ.mp3');
  soundHM = loadSound('music/HM.mp3');
  soundHT = loadSound('music/HT.mp3');
  soundLJ = loadSound('music/LJ.mp3');
  soundLM = loadSound('music/LM.mp3');
  soundLT = loadSound('music/LT.mp3');
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {
  // 讓畫布置中
  let cnv = createCanvas(640, 480);
  cnv.parent(document.body); // 讓畫布加到 body
  cnv.position((windowWidth - width) / 2, (windowHeight - height) / 2);

  // 正確的攝影機啟動方式
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  // Start detecting hands
  handPose.detectStart(video, gotHands);
}

function draw() {
  // background(0); // 可以保留或移除，看你是否要黑色背景
  if (video && video.loadedmetadata) {
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop();
  } else {
    background(50); // 若沒攝影機畫面，顯示灰色
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("等待攝影機...", width / 2, height / 2);
    return;
  }

  let leftTouch = false;
  let rightTouch = false;

  // 跨手觸碰偵測
  let leftIndex = null, rightThumb = null, rightIndex = null, leftThumb = null;

  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        if (hand.handedness == "Left") {
          leftIndex = hand.keypoints[8];
          leftThumb = hand.keypoints[4];
        } else {
          rightIndex = hand.keypoints[8];
          rightThumb = hand.keypoints[4];
        }
      }
    }
  }

  // 左手食指碰右手大拇指
  let leftCrossTouch = false;
  if (leftIndex && rightThumb) {
    let d = dist(leftIndex.x, leftIndex.y, rightThumb.x, rightThumb.y);
    if (d < 30) leftCrossTouch = true;
  }
  // 右手食指碰左手大拇指
  let rightCrossTouch = false;
  if (rightIndex && leftThumb) {
    let d = dist(rightIndex.x, rightIndex.y, leftThumb.x, leftThumb.y);
    if (d < 30) rightCrossTouch = true;
  }

  // 只在剛觸碰時且冷卻時間到時切換顏色並播放change音樂
  let now = millis();
  if (leftCrossTouch && !lastLeftCrossTouch && now - lastLeftSwitchTime > 2000) {
    leftColorIndex = (leftColorIndex + 1) % leftColors.length;
    lastLeftSwitchTime = now;
    if (changeSound) {
      changeSound.play();
    }
  }
  if (rightCrossTouch && !lastRightCrossTouch && now - lastRightSwitchTime > 2000) {
    rightColorIndex = (rightColorIndex + 1) % rightColors.length;
    lastRightSwitchTime = now;
    if (changeSound) {
      changeSound.play();
    }
  }
  lastLeftCrossTouch = leftCrossTouch;
  lastRightCrossTouch = rightCrossTouch;

  // 單手觸碰音樂判斷與手部繪製
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        let kp4 = hand.keypoints[4];
        let kp8 = hand.keypoints[8];
        let d = dist(kp4.x, kp4.y, kp8.x, kp8.y);

        if (d < 30) {
          if (hand.handedness == "Left") {
            leftTouch = true;
          } else {
            rightTouch = true;
          }
        }

        // 畫出每個手指的線段
        let fingerIndices = [
          [0, 1, 2, 3, 4],      // 大拇指
          [5, 6, 7, 8],         // 食指
          [9, 10, 11, 12],      // 中指
          [13, 14, 15, 16],     // 無名指
          [17, 18, 19, 20]      // 小指
        ];

        // 設定顏色（根據索引）
        let color;
        if (hand.handedness == "Left") {
          color = leftColors[leftColorIndex];
        } else {
          color = rightColors[rightColorIndex];
        }
        stroke(color);
        strokeWeight(4);

        // 畫線
        for (let indices of fingerIndices) {
          for (let i = 0; i < indices.length - 1; i++) {
            let kp1 = hand.keypoints[indices[i]];
            let kp2 = hand.keypoints[indices[i + 1]];
            line(kp1.x, kp1.y, kp2.x, kp2.y);
          }
        }

        // 畫圓點（加邊框）
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];
          fill(color);
          stroke(255);
          strokeWeight(2);
          circle(keypoint.x, keypoint.y, 16);
        }
      }
    }
  }

  // 音樂播放邏輯（根據顏色）
  if (leftTouch && !leftWasTouching) {
    // 先停止所有左手音樂
    for (let i = 0; i < leftColorSounds.length; i++) {
      if (leftColorSounds[i].isPlaying()) leftColorSounds[i].stop();
    }
    // 播放對應顏色的音樂
    if (leftColorSounds[leftColorIndex] && !leftColorSounds[leftColorIndex].isPlaying()) {
      leftColorSounds[leftColorIndex].play();
    }
  }
  if (!leftTouch) {
    // 停止所有左手音樂
    for (let i = 0; i < leftColorSounds.length; i++) {
      if (leftColorSounds[i].isPlaying()) leftColorSounds[i].stop();
    }
  }

  if (rightTouch && !rightWasTouching) {
    // 先停止所有右手音樂
    for (let i = 0; i < rightColorSounds.length; i++) {
      if (rightColorSounds[i].isPlaying()) rightColorSounds[i].stop();
    }
    // 播放對應顏色的音樂
    if (rightColorSounds[rightColorIndex] && !rightColorSounds[rightColorIndex].isPlaying()) {
      rightColorSounds[rightColorIndex].play();
    }
  }
  if (!rightTouch) {
    // 停止所有右手音樂
    for (let i = 0; i < rightColorSounds.length; i++) {
      if (rightColorSounds[i].isPlaying()) rightColorSounds[i].stop();
    }
  }

  // 雙手食指同時觸碰判斷
  let leftIndex8 = null, rightIndex8 = null;
  if (hands.length > 1) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        if (hand.handedness == "Left") leftIndex8 = hand.keypoints[8];
        if (hand.handedness == "Right") rightIndex8 = hand.keypoints[8];
      }
    }
  }
  let comboTouch = false;
  if (leftIndex8 && rightIndex8) {
    let d = dist(leftIndex8.x, leftIndex8.y, rightIndex8.x, rightIndex8.y);
    if (d < 30) comboTouch = true;
  }

  // 只在剛觸碰時且冷卻時間到時播放一次
  // 這裡不要再 let now = millis(); 了，直接用 now
  if (comboTouch && !lastComboTouch && now - lastComboPlayTime > 8000) {
    lastComboPlayTime = now;
    // 根據顏色組合播放對應音樂
    if (leftColorIndex === 0 && rightColorIndex === 0) {
      if (soundCJ) soundCJ.play();
    } else if (leftColorIndex === 0 && rightColorIndex === 1) {
      if (soundCM) soundCM.play();
    } else if (leftColorIndex === 0 && rightColorIndex === 2) {
      if (soundCT) soundCT.play();
    } else if (leftColorIndex === 1 && rightColorIndex === 0) {
      if (soundHJ) soundHJ.play();
    } else if (leftColorIndex === 1 && rightColorIndex === 1) {
      if (soundHM) soundHM.play();
    } else if (leftColorIndex === 1 && rightColorIndex === 2) {
      if (soundHT) soundHT.play();
    } else if (leftColorIndex === 2 && rightColorIndex === 0) {
      if (soundLJ) soundLJ.play();
    } else if (leftColorIndex === 2 && rightColorIndex === 1) {
      if (soundLM) soundLM.play();
    } else if (leftColorIndex === 2 && rightColorIndex === 2) {
      if (soundLT) soundLT.play();
    }
  }
  lastComboTouch = comboTouch;

  // 更新上一幀狀態
  leftWasTouching = leftTouch;
  rightWasTouching = rightTouch;

  fill(255, 150);
  rectMode(CENTER);
  rect(width / 2, height - 67, 600, 130, 20);
  fill(0);
  textSize(18);
  textAlign(CENTER, CENTER);
  text(
    "玩法說明：（請注意自己設備音量）\n" +
    "1. 左/右手食指與大拇指碰觸，播放該手蓋亞記憶體的音效。\n" +
    "2. 左手食指碰右手大拇指切換左手蓋亞記憶體，\n"+
    "右手食指碰左手大拇指切換右手蓋亞記憶體。\n" +
    "3. 左右手食指互碰，依蓋亞記憶體組合播放變身音樂。",
    width / 2, height - 65
  );
}

let leftColorIndex = 0;
let rightColorIndex = 0;
let lastLeftSwitchTime = 0;
let lastRightSwitchTime = 0;
let lastLeftCrossTouch = false;
let lastRightCrossTouch = false;
let leftWasTouching = false;
let rightWasTouching = false;
let lastComboPlayTime = 0;
