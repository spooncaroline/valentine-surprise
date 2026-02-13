const yesButton = document.getElementById("yesButton");
const noButton = document.getElementById("noButton");
const actions = document.getElementById("actions");
const canvas = document.getElementById("heartCanvas");
const ctx = canvas.getContext("2d");

let noScale = 1;
let noPosition = { x: 0, y: 0 };
let heartEffect = null;
let heartAnimationId = null;
let lastTime = 0;
const HEART_COLOR = "#FFC0CB";
const IMAGE_ENLARGE = 11;

const heartFunction = (t, shrinkRatio, centerX, centerY) => {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y =
    -(13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t));
  return {
    x: x * shrinkRatio + centerX,
    y: y * shrinkRatio + centerY,
  };
};

const scatterInside = (x, y, centerX, centerY, beta = 0.15) => {
  const ratioX = -beta * Math.log(Math.random());
  const ratioY = -beta * Math.log(Math.random());
  const dx = ratioX * (x - centerX);
  const dy = ratioY * (y - centerY);
  return { x: x - dx, y: y - dy };
};

const shrink = (x, y, centerX, centerY, ratio) => {
  const force =
    -1 /
    Math.pow(
      Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2),
      0.6
    );
  const dx = ratio * force * (x - centerX);
  const dy = ratio * force * (y - centerY);
  return { x: x - dx, y: y - dy };
};

const curve = (p) => (2 * Math.sin(4 * p)) / Math.PI;

class HeartEffect {
  constructor(width, height, generateFrame = 20) {
    this.points = [];
    this.edgeDiffusionPoints = [];
    this.centerDiffusionPoints = [];
    this.allPoints = [];
    this.width = width;
    this.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.build(2000);
    this.randomHalo = 1000;
    this.generateFrame = generateFrame;
    for (let frame = 0; frame < generateFrame; frame += 1) {
      this.calc(frame);
    }
  }

  build(number) {
    const pointSet = new Set();
    for (let i = 0; i < number; i += 1) {
      const t = Math.random() * Math.PI * 2;
      const point = heartFunction(
        t,
        IMAGE_ENLARGE,
        this.centerX,
        this.centerY
      );
      const key = `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
      if (!pointSet.has(key)) {
        pointSet.add(key);
        this.points.push(point);
      }
    }
    this.points.forEach((point) => {
      for (let i = 0; i < 3; i += 1) {
        this.edgeDiffusionPoints.push(
          scatterInside(point.x, point.y, this.centerX, this.centerY, 0.05)
        );
      }
    });
    const pointList = this.points;
    for (let i = 0; i < 4000; i += 1) {
      const point = pointList[Math.floor(Math.random() * pointList.length)];
      this.centerDiffusionPoints.push(
        scatterInside(point.x, point.y, this.centerX, this.centerY, 0.17)
      );
    }
  }

  static calcPosition(x, y, centerX, centerY, ratio) {
    const force =
      1 /
      Math.pow(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2), 0.52);
    const dx = ratio * force * (x - centerX) + Math.floor(Math.random() * 3 - 1);
    const dy = ratio * force * (y - centerY) + Math.floor(Math.random() * 3 - 1);
    return { x: x - dx, y: y - dy };
  }

  calc(generateFrame) {
    const ratio = 10 * curve((generateFrame / 10) * Math.PI);
    const haloRadius = Math.floor(
      4 + 6 * (1 + curve((generateFrame / 10) * Math.PI))
    );
    const haloNumber = Math.floor(
      3000 + 4000 * Math.abs(Math.pow(curve((generateFrame / 10) * Math.PI), 2))
    );
    const allPoints = [];
    const heartHaloPoint = new Set();
    for (let i = 0; i < haloNumber; i += 1) {
      const t = Math.random() * Math.PI * 2;
      const point = heartFunction(t, 11.6, this.centerX, this.centerY);
      const shrunk = shrink(
        point.x,
        point.y,
        this.centerX,
        this.centerY,
        haloRadius
      );
      const key = `${shrunk.x.toFixed(1)},${shrunk.y.toFixed(1)}`;
      if (!heartHaloPoint.has(key)) {
        heartHaloPoint.add(key);
        const x = shrunk.x + Math.floor(Math.random() * 29 - 14);
        const y = shrunk.y + Math.floor(Math.random() * 29 - 14);
        const size = [1, 2, 2][Math.floor(Math.random() * 3)];
        allPoints.push({ x, y, size });
      }
    }
    this.points.forEach((point) => {
      const next = HeartEffect.calcPosition(
        point.x,
        point.y,
        this.centerX,
        this.centerY,
        ratio
      );
      const size = Math.floor(Math.random() * 3) + 1;
      allPoints.push({ x: next.x, y: next.y, size });
    });
    this.edgeDiffusionPoints.forEach((point) => {
      const next = HeartEffect.calcPosition(
        point.x,
        point.y,
        this.centerX,
        this.centerY,
        ratio
      );
      const size = Math.floor(Math.random() * 2) + 1;
      allPoints.push({ x: next.x, y: next.y, size });
    });
    this.centerDiffusionPoints.forEach((point) => {
      const next = HeartEffect.calcPosition(
        point.x,
        point.y,
        this.centerX,
        this.centerY,
        ratio
      );
      const size = Math.floor(Math.random() * 2) + 1;
      allPoints.push({ x: next.x, y: next.y, size });
    });
    this.allPoints[generateFrame] = allPoints;
  }
}

const resizeCanvas = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (heartEffect) {
    heartEffect = new HeartEffect(
      canvas.width,
      canvas.height,
      heartEffect.generateFrame
    );
  }
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const setNoPosition = (x, y) => {
  const rect = actions.getBoundingClientRect();
  const buttonRect = noButton.getBoundingClientRect();
  const padding = 16;
  const maxX = rect.width - buttonRect.width - padding;
  const maxY = rect.height - buttonRect.height - padding;
  const clampedX = clamp(x, padding, maxX);
  const clampedY = clamp(y, padding, maxY);
  noPosition = { x: clampedX, y: clampedY };
  noButton.style.left = `${clampedX}px`;
  noButton.style.top = `${clampedY}px`;
};

const initNoButton = () => {
  const rect = actions.getBoundingClientRect();
  const buttonRect = noButton.getBoundingClientRect();
  noButton.style.position = "absolute";
  const startX = rect.width / 2 + 40 - buttonRect.width / 2;
  const startY = rect.height / 2 - buttonRect.height / 2;
  setNoPosition(startX, startY);
};

const evadeNoButton = (cursorX, cursorY) => {
  const rect = actions.getBoundingClientRect();
  const buttonRect = noButton.getBoundingClientRect();
  const padding = 16;
  const availableWidth = rect.width - buttonRect.width - padding * 2;
  const availableHeight = rect.height - buttonRect.height - padding * 2;
  const targetX = padding + Math.random() * availableWidth;
  const targetY = padding + Math.random() * availableHeight;
  noScale = Math.max(0.35, noScale * 0.88);
  noButton.style.transform = `scale(${noScale})`;
  setNoPosition(targetX, targetY);
};

const handleMouseMove = (event) => {
  const rect = actions.getBoundingClientRect();
  const cursorX = event.clientX - rect.left;
  const cursorY = event.clientY - rect.top;
  const buttonRect = noButton.getBoundingClientRect();
  const buttonCenterX = noPosition.x + buttonRect.width / 2;
  const buttonCenterY = noPosition.y + buttonRect.height / 2;
  const dx = cursorX - buttonCenterX;
  const dy = cursorY - buttonCenterY;
  const distance = Math.hypot(dx, dy);
  const triggerDistance = 140 * noScale;
  if (distance < triggerDistance) {
    evadeNoButton(cursorX, cursorY);
  }
};

const drawHeart = (time) => {
  lastTime = time;
  if (!heartEffect) {
    heartAnimationId = requestAnimationFrame(drawHeart);
    return;
  }
  const frame = Math.floor((time / 1000) * 8) % heartEffect.generateFrame;
  const points = heartEffect.allPoints[frame] || [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = HEART_COLOR;
  points.forEach((point) => {
    ctx.fillRect(point.x, point.y, point.size, point.size);
  });
  ctx.restore();
  heartAnimationId = requestAnimationFrame(drawHeart);
};

const startHeart = () => {
  canvas.classList.add("active");
  heartEffect = new HeartEffect(canvas.width, canvas.height, 20);
  lastTime = performance.now();
  heartAnimationId = requestAnimationFrame(drawHeart);
};

yesButton.addEventListener("click", () => {
  actions.classList.add("hidden");
  startHeart();
});

actions.addEventListener("mousemove", handleMouseMove);
window.addEventListener("resize", () => {
  resizeCanvas();
  initNoButton();
});

resizeCanvas();
initNoButton();
