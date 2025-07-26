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
    document.addEventListener('mousemove', handleMouseMove, true);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp, true);
      document.removeEventListener('mousemove', handleMouseMove, true);
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
  const panSpeed = 6; // 平移速度  

  const mouseDownRef = useRef({ mouseDown: false, zoom: cavRef.current?.zoom(), clientX: 0, clientY: 0, left: 0, top: 0 }); // 鼠标按下时的数据
  const mouseMoveRef = useRef({ clientX: 0, clientY: 0, translateX: 0, translateY: 0, }); // 存储按下移动的数据
  // 鼠标按下时修改静态变量
  const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const { clientX, clientY } = e;
    Object.assign(mouseDownRef.current, { mouseDown: true, zoom: cavRef.current?.zoom(), clientX, clientY, left: 0, top: 0 });
  };
  // 鼠标释放时停止所有动画
  const handleMouseUp = () => {
    console.log('mouse up');
    Object.assign(mouseDownRef.current, { mouseDown: false, left: 0, top: 0 });
    Object.assign(mouseMoveRef.current, { clientX: 0, clientY: 0, translateX: 0, translateY: 0 });
  };

  // 鼠标平移
  const handleMouseMove = (e: MouseEvent) => {
    if (!mouseDownRef.current.mouseDown || !cavRef.current || !refContainer.current) {
      return;
    }

    // 获取选框元素
    const rubberDom = document.querySelector('.x6-widget-selection-rubberband') as HTMLElement;
    if (!rubberDom) return;

    // 存储首次定位信息
    if (!mouseDownRef.current.left) {
      const style = window.getComputedStyle(rubberDom);
      const left = parseFloat(style.left) || 0;
      const top = parseFloat(style.top) || 0;
      Object.assign(mouseDownRef.current, { left, top, });
    }

    const { clientX, clientY } = e;
    const rect = refContainer.current.getBoundingClientRect();

    // 检测靠近边界
    let dx = 0;
    let dy = 0;
    if (clientX - rect.left < edgeThreshold) {
      dx = panSpeed; // 左侧边界
    } else if (rect.right - clientX < edgeThreshold) {
      dx = -panSpeed; // 右侧边界
    } else if (clientY - rect.top < edgeThreshold) {
      dy = panSpeed; // 上侧边界
    } else if (rect.bottom - clientY < edgeThreshold) {
      dy = -panSpeed; // 下侧边界
    }

    const { zoom = 1, clientX: agoCX, clientY: agoCY, left, top } = mouseDownRef.current;
    const { translateX: agoTranslateX, translateY: agoTranslateY } = mouseMoveRef.current;

    // 没有靠近边界，且没有平移量的时候，用系统自带的框选功能
    if (dx === 0 && dy === 0 && agoTranslateX === 0 && agoTranslateY === 0) {
      return
    }

    // 鼠标移动距离
    const moveX = agoCX ? clientX - agoCX : 0;
    const moveY = agoCY ? clientY - agoCY : 0;

    // 计算平移方向
    const directX = moveX > 0 ? 'right' : 'left';
    const directY = moveY > 0 ? 'bottom' : 'top';

    // 缩放的平移量
    const scaledDx = Math.round(dx / zoom);
    const scaledDy = Math.round(dy / zoom);

    const mouseMoveX = clientX - agoCX; // 鼠标水平总移动距离
    const mouseMoveY = clientY - agoCY; // 鼠标垂直总移动距离
    const translateX = agoTranslateX - scaledDx; // 当前平移水平距离
    const translateY = agoTranslateY - scaledDy; // 当前平移垂直距离

    const newWidth = Math.abs(mouseMoveX + translateX);
    const newHeight = Math.abs(mouseMoveY + translateY);

    // 调整定位：右下方向不需要实时更新定位，有偏移才更新。左上需要实时更新定位，不需要计算偏移量
    const isLeftTop = directX === 'left' || directY === 'top';
    let newLeft = isLeftTop ? left + mouseMoveX : left - translateX;
    let newTop = isLeftTop ? top + mouseMoveY : top - translateY;

    // 修改定位
    rubberDom.style.left = `${newLeft}px`;
    rubberDom.style.top = `${newTop}px`;

    // 调整大小
    rubberDom.style.width = `${newWidth}px`; // 如果改变方向，要取绝对值，切更新left和top
    rubberDom.style.height = `${newHeight}px`;

    Object.assign(mouseMoveRef.current, { clientX, clientY, left, top, translateX, translateY }); // 鼠标数据存储，移动距离清零

    // 平移画布
    if (scaledDx != 0 || scaledDy != 0) {
      cavRef.current.translateBy(scaledDx, scaledDy);
    }
    e.stopPropagation();
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
        // onMouseMove={handleMouseMove}
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