import React, { useEffect, useRef } from 'react';
import { Graph } from '@antv/x6';
import { Selection } from '@antv/x6-plugin-selection';

const X6RubberbandDemo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const selectionRef = useRef<Selection | null>(null);


  // 初始化画布
  useEffect(() => {
    if (!containerRef.current) return;

    // 创建画布实例
    const graph = new Graph({
      container: containerRef.current,
      width: 1200,
      height: 800,
      grid: true,
    });

    // 初始化选择插件
    const selection = new Selection({
      enabled: true,
      multiple: true,
      rubberband: true,
      movable: true,
      showNodeSelectionBox: true,
    });

    graph.use(selection);
    graphRef.current = graph;
    selectionRef.current = selection;

    // 创建示例节点
    createSampleNodes(graph);

  });

  // 创建示例节点
  const createSampleNodes = (graph: Graph) => {
    const colors = ['#ff9e3d', '#73d13d', '#36cfc9', '#597ef7', '#9254de'];

    // 创建100个随机节点
    for (let i = 0; i < 100; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];

      graph.addNode({
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      padding: 16,
      backgroundColor: '#f5f7fa',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div
        ref={containerRef}
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