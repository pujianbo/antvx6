import React, { useRef, useEffect, useState } from 'react';
import "./GraphDemo.css";

// 模拟图形节点数据
const sampleNodes = [
  { id: 'node1', x: 100, y: 100, label: '节点 1', color: '#3b82f6' },
  { id: 'node2', x: 300, y: 150, label: '节点 2', color: '#10b981' },
  { id: 'node3', x: 500, y: 200, label: '节点 3', color: '#f59e0b' },
  { id: 'node4', x: 200, y: 300, label: '节点 4', color: '#ef4444' },
  { id: 'node5', x: 400, y: 350, label: '节点 5', color: '#8b5cf6' },
  { id: 'node6', x: 600, y: 400, label: '节点 6', color: '#ec4899' },
  { id: 'node7', x: 150, y: 500, label: '节点 7', color: '#06b6d4' },
  { id: 'node8', x: 450, y: 550, label: '节点 8', color: '#84cc16' },
  { id: 'node9', x: 750, y: 300, label: '节点 9', color: '#f97316' },
  { id: 'node10', x: 850, y: 450, label: '节点 10', color: '#6366f1' },
];

const sampleEdges = [
  { source: 'node1', target: 'node2' },
  { source: 'node2', target: 'node3' },
  { source: 'node1', target: 'node4' },
  { source: 'node4', target: 'node5' },
  { source: 'node5', target: 'node6' },
  { source: 'node7', target: 'node8' },
  { source: 'node3', target: 'node9' },
  { source: 'node6', target: 'node10' },
];

interface SmartSelectionGraphProps {
  className?: string;
  edgeDistance?: number;
  scrollSpeed?: number;
}

const SmartSelectionGraph: React.FC<SmartSelectionGraphProps> = ({
  className = '',
  edgeDistance = 50,
  scrollSpeed = 5
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const nodesRef = useRef(sampleNodes);
  const edgesRef = useRef(sampleEdges);
  
  // 绘制图形
  const drawGraph = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 设置画布大小
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格背景
    const gridSize = 20;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x - scrollPosition.x % gridSize, 0);
      ctx.lineTo(x - scrollPosition.x % gridSize, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y - scrollPosition.y % gridSize);
      ctx.lineTo(canvas.width, y - scrollPosition.y % gridSize);
      ctx.stroke();
    }
    
    // 绘制边
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    
    edgesRef.current.forEach(edge => {
      const sourceNode = nodesRef.current.find(n => n.id === edge.source);
      const targetNode = nodesRef.current.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(
          sourceNode.x - scrollPosition.x + 60, 
          sourceNode.y - scrollPosition.y + 30
        );
        ctx.lineTo(
          targetNode.x - scrollPosition.x + 60, 
          targetNode.y - scrollPosition.y + 30
        );
        ctx.stroke();
        
        // 绘制箭头
        const angle = Math.atan2(
          targetNode.y - sourceNode.y, 
          targetNode.x - sourceNode.x
        );
        
        ctx.save();
        ctx.translate(
          targetNode.x - scrollPosition.x + 60, 
          targetNode.y - scrollPosition.y + 30
        );
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-10, -5);
        ctx.lineTo(-10, 5);
        ctx.closePath();
        ctx.fillStyle = '#94a3b8';
        ctx.fill();
        ctx.restore();
      }
    });
    
    // 绘制节点
    nodesRef.current.forEach(node => {
      const x = node.x - scrollPosition.x;
      const y = node.y - scrollPosition.y;
      const isSelected = selectedNodes.includes(node.id);
      
      // 节点背景
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.roundRect(x, y, 120, 60, 8);
      ctx.fill();
      
      // 节点边框
      ctx.strokeStyle = isSelected ? '#ffffff' : '#cbd5e1';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();
      
      // 节点文字
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, x + 60, y + 30);
      
      // 选中状态指示器
      if (isSelected) {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(x + 110, y + 10, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('✓', x + 110, y + 10);
      }
    });
    
    // 绘制选择框
    if (isSelecting) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        selectionBox.x,
        selectionBox.y,
        selectionBox.width,
        selectionBox.height
      );
      ctx.setLineDash([]);
      
      // 绘制选择框内部半透明填充
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.fillRect(
        selectionBox.x,
        selectionBox.y,
        selectionBox.width,
        selectionBox.height
      );
    }
  };
  
  // 检测节点是否在选择框内
  const checkNodeInSelection = (node: any) => {
    const x = node.x - scrollPosition.x;
    const y = node.y - scrollPosition.y;
    
    const selectionLeft = Math.min(selectionBox.x, selectionBox.x + selectionBox.width);
    const selectionRight = Math.max(selectionBox.x, selectionBox.x + selectionBox.width);
    const selectionTop = Math.min(selectionBox.y, selectionBox.y + selectionBox.height);
    const selectionBottom = Math.max(selectionBox.y, selectionBox.y + selectionBox.height);
    
    return (
      x < selectionRight &&
      x + 120 > selectionLeft &&
      y < selectionBottom &&
      y + 60 > selectionTop
    );
  };
  
  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 检查是否点击在节点上
    let clickedOnNode = false;
    nodesRef.current.forEach(node => {
      const nodeX = node.x - scrollPosition.x;
      const nodeY = node.y - scrollPosition.y;
      
      if (
        x >= nodeX && 
        x <= nodeX + 120 && 
        y >= nodeY && 
        y <= nodeY + 60
      ) {
        clickedOnNode = true;
        // 切换节点选中状态
        if (e.shiftKey) {
          // Shift键多选
          setSelectedNodes(prev => 
            prev.includes(node.id) 
              ? prev.filter(id => id !== node.id) 
              : [...prev, node.id]
          );
        } else if (!selectedNodes.includes(node.id)) {
          // 单选
          setSelectedNodes([node.id]);
        }
      }
    });
    
    // 如果没点击在节点上，开始框选
    if (!clickedOnNode) {
      setIsSelecting(true);
      selectionStartRef.current = { x, y };
      setSelectionBox({ x, y, width: 0, height: 0 });
      
      // 如果没按Shift键，清空已选节点
      if (!e.shiftKey) {
        setSelectedNodes([]);
      }
    }
  };
  
  // 处理鼠标移动事件
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !isSelecting || !selectionStartRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const startX = selectionStartRef.current.x;
    const startY = selectionStartRef.current.y;
    
    // 更新选择框
    setSelectionBox({
      x: Math.min(startX, x),
      y: Math.min(startY, y),
      width: Math.abs(x - startX),
      height: Math.abs(y - startY)
    });
    
    // 检查是否需要滚动
    const scrollThreshold = edgeDistance;
    let scrollX = 0;
    let scrollY = 0;
    
    if (x < scrollThreshold) {
      scrollX = -scrollSpeed;
    } else if (x > rect.width - scrollThreshold) {
      scrollX = scrollSpeed;
    }
    
    if (y < scrollThreshold) {
      scrollY = -scrollSpeed;
    } else if (y > rect.height - scrollThreshold) {
      scrollY = scrollSpeed;
    }
    
    // 处理滚动
    if (scrollX !== 0 || scrollY !== 0) {
      if (!scrollIntervalRef.current) {
        scrollIntervalRef.current = setInterval(() => {
          setScrollPosition(prev => ({
            x: prev.x + scrollX,
            y: prev.y + scrollY
          }));
        }, 16); // 约60fps
      }
    } else if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    
    // 更新选中节点
    const selected = nodesRef.current
      .filter(node => checkNodeInSelection(node))
      .map(node => node.id);
    
    setSelectedNodes(prev => {
      // 保留Shift键多选状态
      if (e.shiftKey) {
        return Array.from(new Set([...prev, ...selected]));
      }
      return selected;
    });
    
    // 请求重绘
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(drawGraph);
  };
  
  // 处理鼠标释放事件
  const handleMouseUp = () => {
    setIsSelecting(false);
    selectionStartRef.current = null;
    
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    
    // 请求重绘
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(drawGraph);
  };
  
  // 处理鼠标离开事件
  const handleMouseLeave = () => {
    if (isSelecting) {
      handleMouseUp();
    }
  };
  
  // 初始化和重绘
  useEffect(() => {
    drawGraph();
    
    // 窗口大小变化时重绘
    const handleResize = () => {
      drawGraph();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scrollPosition, isSelecting, selectionBox, selectedNodes]);
  
  return (
    <div className={`smart-graph-container ${className}`}>
      <div className="graph-header">
        <h2>智能框选图形组件</h2>
        <div className="controls">
          <div className="info">
            <span>已选节点: {selectedNodes.length}个</span>
            <span>滚动位置: ({scrollPosition.x}, {scrollPosition.y})</span>
          </div>
          <div className="tips">
            <span>提示: 按住Shift键可多选节点</span>
            <span>拖拽到边缘可自动滚动</span>
          </div>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="graph-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <canvas ref={canvasRef} className="graph-canvas" />
        
        {isSelecting && (
          <div className="selection-indicator">
            <div>框选模式中</div>
            <div>宽度: {Math.abs(selectionBox.width)}px</div>
            <div>高度: {Math.abs(selectionBox.height)}px</div>
          </div>
        )}
      </div>
      
      <div className="legend">
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: '#3b82f6' }}></div>
          <span>普通节点</span>
        </div>
        <div className="legend-item">
          <div className="color-box selected"></div>
          <span>已选节点</span>
        </div>
        <div className="legend-item">
          <div className="color-box selection"></div>
          <span>框选区域</span>
        </div>
      </div>
    </div>
  );
};

export default SmartSelectionGraph;