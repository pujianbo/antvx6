import React, { useEffect, useRef } from 'react';
import { Graph } from '@antv/x6';
import { Selection } from '@antv/x6-plugin-selection';

const X6SelectionDemo = () => {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const selectionRef = useRef(null);
  const autoScrollTimerRef = useRef(null);
  const lastTranslateRef = useRef({ tx: 0, ty: 0 });

  const EDGE_SCROLL_THRESHOLD = 30;
  const SCROLL_SPEED = 10;

  useEffect(() => {
    if (!containerRef.current) return;

    const graph = new Graph({
      container: containerRef.current,
      width: 800,
      height: 600,
      grid: true,
      connecting: {
        router: 'orth',
        connector: 'rounded',
        anchor: 'center',
        connectionPoint: 'anchor',
      },
      scroller: {
        enabled: true,
        pageVisible: false,
        pageBreak: false,
      },
    });

    const selection = new Selection({
      enabled: true,
      multiple: true,
      rubberband: true,
      movable: true,
      showNodeSelectionBox: true,
    });

    graph.use(selection);
    selectionRef.current = selection;
    graphRef.current = graph;

    // 添加示例节点和边
    const nodes = [];
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 5; j++) {
        nodes.push(
          graph.addNode({
            x: 100 + i * 120,
            y: 100 + j * 80,
            width: 80,
            height: 40,
            label: `Node ${i}-${j}`,
            attrs: {
              body: {
                stroke: '#8f8f8f',
                strokeWidth: 1,
                fill: '#fff',
                rx: 6,
                ry: 6,
              },
            },
          })
        );
      }
    }

    for (let i = 0; i < nodes.length - 1; i++) {
      if (i % 2 === 0) {
        graph.addEdge({
          source: nodes[i],
          target: nodes[i + 1],
          attrs: {
            line: {
              stroke: '#8f8f8f',
              strokeWidth: 1,
            },
          },
        });
      }
    }

    const handleMouseMove = (e) => {
      if (!selection.isRubberbandEnabled()) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const shouldScroll = {
        left: mouseX < EDGE_SCROLL_THRESHOLD,
        right: mouseX > rect.width - EDGE_SCROLL_THRESHOLD,
        up: mouseY < EDGE_SCROLL_THRESHOLD,
        down: mouseY > rect.height - EDGE_SCROLL_THRESHOLD,
      };

      if (autoScrollTimerRef.current) {
        cancelAnimationFrame(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }

      if (Object.values(shouldScroll).some(Boolean)) {
        const scroll = () => {
          const { tx, ty } = lastTranslateRef.current;
          let newTx = tx;
          let newTy = ty;

          if (shouldScroll.left) newTx = tx + SCROLL_SPEED;
          if (shouldScroll.right) newTx = tx - SCROLL_SPEED;
          if (shouldScroll.up) newTy = ty + SCROLL_SPEED;
          if (shouldScroll.down) newTy = ty - SCROLL_SPEED;

          graph.translate(newTx, newTy);
          lastTranslateRef.current = { tx: newTx, ty: newTy };

          updateSelectionBox(e);
          autoScrollTimerRef.current = requestAnimationFrame(scroll);
        };

        autoScrollTimerRef.current = requestAnimationFrame(scroll);
      } else {
        updateSelectionBox(e);
      }
    };

    const updateSelectionBox = (e) => {
      if (!selection.isRubberbandEnabled()) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const { tx, ty } = lastTranslateRef.current;
      const canvasMouseX = mouseX + tx;
      const canvasMouseY = mouseY + ty;

      const startX = selection.startX;
      const startY = selection.startY;

      const left = Math.min(startX, canvasMouseX);
      const top = Math.min(startY, canvasMouseY);
      const width = Math.abs(canvasMouseX - startX);
      const height = Math.abs(canvasMouseY - startY);

      const selectionBox = document.querySelector('.x6-widget-selection-box');
      if (selectionBox) {
        selectionBox.style.left = `${left - tx}px`;
        selectionBox.style.top = `${top - ty}px`;
        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;
      }
    };

    containerRef.current.addEventListener('mousemove', handleMouseMove);

    graph.on('blank:mousedown', ({ e }) => {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const { tx, ty } = lastTranslateRef.current;
      selection.startX = mouseX + tx; // 记录画布坐标系下的初始位置
      selection.startY = mouseY + ty;
    });

    graph.on('translate', ({ tx, ty }) => {
      lastTranslateRef.current = { tx, ty };
    });

    return () => {
      if (autoScrollTimerRef.current) {
        cancelAnimationFrame(autoScrollTimerRef.current);
      }
      containerRef.current?.removeEventListener('mousemove', handleMouseMove);
      graph.dispose();
    };
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>AntV X6 框选节点 Demo</h1>
      <p>按住鼠标左键拖动进行框选，移动到边缘可自动平移画布</p>
      <div 
        ref={containerRef} 
        style={{
          border: '1px solid #f0f0f0',
          borderRadius: '4px',
          marginTop: '20px',
          overflow: 'hidden',
          width: '800px',
          height: '600px',
          position: 'relative',
        }}
      />
    </div>
  );
};

export default X6SelectionDemo;