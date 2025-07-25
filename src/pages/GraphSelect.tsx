import React, { useEffect, useRef } from 'react';
import { Graph } from '@antv/x6';
import { Selection } from '@antv/x6-plugin-selection';

const X6RubberbandDemo: React.FC = () => {
  const refContainer = useRef<HTMLDivElement>(null);
  const cavRef = useRef<Graph | null>(null);


  // 初始化画布
  useEffect(() => {
    if (!refContainer.current) return;

    // 创建画布实例
    const canvGraph = new Graph({
      container: refContainer.current,
      width: 1000,
      height: 800,
      grid: true,
    });

    // 初始化选择插件
    canvGraph.use(new Selection({
      enabled: true,
      multiple: true,
      rubberband: true,
      movable: true,
      showNodeSelectionBox: true,
    }));

    cavRef.current = canvGraph;

    // 创建示例节点
    createSampleNodes();

    document.addEventListener('mouseup', handleMouseUp, true);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp, true);
    };

  });

  // 创建示例节点
  const createSampleNodes = () => {
    const colors = ['#ff9e3d', '#73d13d', '#36cfc9', '#597ef7', '#9254de'];
    if (!cavRef.current) return

    // 创建100个随机节点
    for (let i = 0; i < 100; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];

      cavRef.current.addNode({
        id: `node-${i}`,
        shape: 'rect',
        x: Math.floor(Math.random() * 3000),
        y: Math.floor(Math.random() * 3000),
        width: 80,
        height: 40,
        attrs: {
          body: {
            fill: color,
            stroke: '#000',
            strokeWidth: 1,
            rx: 4,
            ry: 4,
          },
          label: {
            text: `节点 ${i + 1}`,
            fill: '#fff',
            fontSize: 12,
            fontWeight: 'bold',
          },
        },
      });
    }
  };

  const edgeThreshold = 50; // 距离边距多少触发
  const panSpeed = 10; // 平移速度  
  // 新增状态管理
  const isPanningRef = useRef(false); // 是否正在框选移动中
  const isMouseDownRef = useRef(false); // 是否画布中按下了鼠标
  const mouseDownRef = useRef({ zoom: cavRef.current?.zoom(), clientX: 0, clientY: 0 }); // 鼠标按下时的数据
  const mouseMoveRef = useRef({
    clientX: 0 /* 鼠标按下时的x坐标 */,
    clientY: 0 /* 鼠标按下时的y坐标 */,
    moveX: 0 /* 鼠标移动时的x坐标 */,
    moveY: 0 /* 鼠标移动时的y坐标 */,
    scaledDx: 0 /* 鼠标移动时，x方向缩放的距离 */,
    scaledDy: 0 /* 鼠标移动时，y方向缩放的距离 */,
    width: 0 /* 选框宽度 */,
    height: 0 /* 选框高度 */,
    left: 0 /* 选框定位left */,
    top: 0 /* 选框定位right */,
    isLeftUp: null /* 鼠标方向是否在左上角 */,
    directChange: false /* 是否方向改变过 */,
    translateX: 0 /* 画布平移的x方向距离 */,
    translateY: 0 /* 画布平移的y方向距离 */,
  }); // 存储画布数据
  const autoPanRequestRef = useRef<number>(0); // 每帧执行函数返回的定时器id
  // 鼠标按下时修改静态变量
  const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    isMouseDownRef.current = true;
    const { clientX, clientY } = e;
    mouseDownRef.current = { clientX, clientY, zoom: cavRef.current?.zoom() };
  };
  // 鼠标释放时停止所有动画
  const handleMouseUp = () => {
    console.log('mouse up');
    isMouseDownRef.current = false;
    isPanningRef.current = false;
    Object.assign(mouseMoveRef.current, { width: 0, height: 0, translateX: 0, translateY: 0 });
    cancelAnimationFrame(autoPanRequestRef.current);
    autoPanRequestRef.current = 0;
  };

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!isMouseDownRef.current || !cavRef.current || !refContainer.current) {
      return;
    }
    const rubberDom = document.querySelector('.x6-widget-selection-rubberband') as HTMLElement;
    if (!rubberDom) return; // 判断是否有选中框

    const { clientX, clientY } = e;
    const rect = refContainer.current.getBoundingClientRect();

    const { clientX: agoCX, clientY: agoCY, isLeftUp: agoIsLeftUp } = mouseMoveRef.current; // 读取上次存的数据

    // 鼠标移动距离
    const moveX = agoCX ? clientX - agoCX : 0;
    const moveY = agoCY ? clientY - agoCY : 0;

    // 计算平移方向
    let dx = 0;
    let dy = 0;
    if (clientX - rect.left < edgeThreshold) {
      dx = panSpeed; // 左侧边界
    }
    if (rect.right - clientX < edgeThreshold) {
      dx = -panSpeed; // 右侧边界
    }
    if (clientY - rect.top < edgeThreshold) {
      dy = panSpeed; // 上侧边界
    }
    if (rect.bottom - clientY < edgeThreshold) {
      dy = -panSpeed; // 下侧边界
    }

    const { zoom = 1 } = mouseDownRef.current;

    // 应用缩放后的平移量
    const scaledDx = Math.round(dx / zoom);
    const scaledDy = Math.round(dy / zoom);

    Object.assign(mouseMoveRef.current, { clientX, clientY, moveX, moveY, scaledDx, scaledDy });

    if (dx !== 0 || dy !== 0) {
      console.log('move');

      const isLeftUp = scaledDx > 0 || scaledDy > 0; // 判断方向是左、上,左上、右下的算法不一致。
      const directChange = typeof agoIsLeftUp === 'boolean' && agoIsLeftUp !== isLeftUp; // 如果方向发生改变，宽高算法发生改变

      Object.assign(mouseMoveRef.current, { isLeftUp, directChange });

      // 初始化宽高
      if (!mouseMoveRef.current.width) {
        const style = window.getComputedStyle(rubberDom);
        const width = parseFloat(style.width) || 0;
        const height = parseFloat(style.height) || 0;
        const left = parseFloat(style.left) || 0;
        const top = parseFloat(style.top) || 0;

        Object.assign(mouseMoveRef.current, { width, height, left, top });
      }

      // 开始平移
      if (!isPanningRef.current) {
        console.log('move-requestAnimationFrame');
        isPanningRef.current = true;
        handleAutoPan();
      }
      e.stopPropagation();
    } else {
      // 停止平移
      console.log('stop');

      isPanningRef.current = false;
      cancelAnimationFrame(autoPanRequestRef.current);

      // 不平移时，如果之前有平移过画布操作，自己处理选框，禁止系统处理
      if (autoPanRequestRef.current) {
        console.log('move-personal-pan');
        handleAutoPan();
        e.stopPropagation();
      }
    }
  };

  const handleAutoPan = () => {
    const rubberDom = document.querySelector('.x6-widget-selection-rubberband') as HTMLElement;
    if (!cavRef.current || !rubberDom) return;

    const { width, height, moveX, moveY, scaledDx, scaledDy } = mouseMoveRef.current;

    // 获取当前位置和尺寸
    const style = window.getComputedStyle(rubberDom);
    const currentX = parseFloat(style.left) || 0;
    const currentY = parseFloat(style.top) || 0;

    const newLeft = currentX + scaledDx;
    const newTop = currentY + scaledDy;
    rubberDom.style.left = `${newLeft}px`;
    rubberDom.style.top = `${newTop}px`;

    // 注意：宽高应增加绝对偏移量（正数）
    const newWidth = width + Math.abs(scaledDx);
    const newHeight = height + Math.abs(scaledDy);
    rubberDom.style.width = `${newWidth}px`;
    rubberDom.style.height = `${newHeight}px`;

    // 更新存储的尺寸（保留moveX/Y用于其他逻辑）
    Object.assign(mouseMoveRef.current, {
      width: newWidth,
      height: newHeight,
      // 注意：这里不清除moveX/Y，因为它们可能在其他地方使用
    });

    // 平移画布
    if (isPanningRef.current) {
      cavRef.current.translateBy(scaledDx, scaledDy);
      autoPanRequestRef.current = requestAnimationFrame(handleAutoPan);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '80vh',
      padding: 16,
      backgroundColor: '#f5f7fa',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div
        ref={refContainer}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          flex: 1,
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          overflow: 'hidden',
          background: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}
      />

    </div>
  );

}

export default X6RubberbandDemo;