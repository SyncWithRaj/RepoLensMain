"use client";

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useEditor } from "@/context/EditorContext";
import api from "@/lib/axios";

// Dynamically import ForceGraph2D (avoids SSR window undef errors)
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export default function GraphView({ repoId }: { repoId: string }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const { setEditorState, editorState } = useEditor();
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoverNode, setHoverNode] = useState<any | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Update dimensions based on parent container dynamically
    const observeDiv = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    const observer = new ResizeObserver(observeDiv);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Additional window fallback
    window.addEventListener('resize', observeDiv);
    observeDiv(); // Initial size

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', observeDiv);
    };
  }, []);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await api.get(`/repos/${repoId}/graph`);

        // ensure format fits force-graph (has target/source identifiers that match node.id)
        if (res.data.success) {
          setGraphData({
            nodes: res.data.graph.nodes,
            links: res.data.graph.edges
          });
        }
      } catch (err) {
        console.error("Error fetching graph data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, [repoId]);

  const visibleGraphData = useMemo(() => {
    const hiddenNodes = new Set<string>();

    // Find all descendants of collapsed folders recursively
    const findDescendants = (parentId: string) => {
      // link source/target could be objects if d3 has already parsed them
      const children = graphData.links
        .filter((l: any) => (l.source?.id || l.source) === parentId && l.label === "contains")
        .map((l: any) => l.target?.id || l.target);

      children.forEach((childId: string) => {
        hiddenNodes.add(childId);
        findDescendants(childId);
      });
    };

    collapsedFolders.forEach(folderId => findDescendants(folderId));

    const nodes = graphData.nodes.filter((n: any) => !hiddenNodes.has(n.id));
    const links = graphData.links.filter((l: any) => {
      const sourceId = l.source?.id || l.source;
      const targetId = l.target?.id || l.target;
      return !hiddenNodes.has(sourceId) && !hiddenNodes.has(targetId);
    });

    return { nodes, links };
  }, [graphData, collapsedFolders]);

  // Adjust force graph physics to make it cleaner and less clumped
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-400); // push nodes apart
      fgRef.current.d3Force('link').distance(50); // space out links
    }
  }, [visibleGraphData]);

  const handleNodeClick = useCallback(async (node: any) => {
    if (node.type === "folder") {
      setCollapsedFolders(prev => {
        const next = new Set(prev);
        if (next.has(node.id)) next.delete(node.id);
        else next.add(node.id);
        return next;
      });
      return;
    }

    try {
      const res = await api.get("/files/content", { params: { repoId, path: node.path || node.id } });
      const ext = node.name.split(".").pop()?.toLowerCase() || "";
      const map: Record<string, string> = {
        js: "javascript", jsx: "javascript",
        ts: "typescript", tsx: "typescript",
        html: "html", css: "css", json: "json", md: "markdown"
      };

      setEditorState({
        filePath: node.id,
        content: res.data.content,
        language: map[ext] || "plaintext"
      });
    } catch (err) {
      console.error("Failed to load file content:", err);
    }
  }, [repoId, setEditorState]);

  if (loading) {
    return (
      <div className="flex w-full h-full items-center justify-center text-[#c9d1d9]">
        <svg className="animate-spin h-8 w-8 text-[#58a6ff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-[#0d1117] overflow-hidden relative group"
      onPointerMove={handlePointerMove}
    >
      <div className="absolute top-4 left-4 z-10 bg-[#161b22] border border-[var(--color-gh-border)] px-4 py-2 rounded-lg shadow-lg">
        <h3 className="text-white text-sm font-semibold">Codebase Visualizer</h3>
        <p className="text-xs text-[#8b949e]">Click a folder to toggle collapse</p>
        <p className="text-xs text-[#8b949e]">Click a file to view code</p>
      </div>

      {hoverNode && (
        <div
          className="absolute z-50 bg-[#161b22] border border-[var(--color-gh-border)] px-4 py-3 rounded-xl shadow-2xl pointer-events-none transition-opacity duration-150"
          style={{ left: mousePos.x + 15, top: mousePos.y + 15, minWidth: '220px' }}
        >
          <div className="font-semibold text-white mb-1 break-all">{hoverNode.name}</div>
          <div className="text-xs text-[#8b949e] mb-2 font-mono break-all pb-2 border-b border-[#30363d]">{hoverNode.id}</div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-[#8b949e]">Type</div>
            <div className="text-right text-[#c9d1d9] capitalize font-medium">{hoverNode.type}</div>

            {hoverNode.type === "folder" ? (
              <>
                <div className="text-[#8b949e]">Descendants</div>
                <div className="text-right text-[#c9d1d9]">{hoverNode.metadata?.descendentCount || 0}</div>
                <div className="text-[#8b949e]">Status</div>
                <div className="text-right text-[#c9d1d9]">{collapsedFolders.has(hoverNode.id) ? "Collapsed" : "Expanded"}</div>
              </>
            ) : (
              <>
                <div className="text-[#8b949e]">Lines</div>
                <div className="text-right text-[#c9d1d9]">{hoverNode.metadata?.totalLines || 0}</div>
                <div className="text-[#8b949e]">Size</div>
                <div className="text-right text-[#c9d1d9]">{(hoverNode.metadata?.fileSize / 1024).toFixed(1)} KB</div>
              </>
            )}
          </div>
        </div>
      )}

      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={visibleGraphData}
        nodeId="id"
        nodeLabel={() => ""} // disable native tooltip
        onNodeHover={setHoverNode}
        nodeVal={(node: any) => node.type === "folder" ? Math.max(8, node.val) : node.val}

        // Custom canvas draw for nodes and their label text!
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;

          let color = "#c9d1d9";
          if (node.id === editorState?.filePath) color = "#ff7b72";
          else if (node.type === "folder") color = collapsedFolders.has(node.id) ? "#a371f7" : "#e3b341"; // gold for folders
          else if (node.metadata?.hasReactComponent) color = "#58a6ff";
          else if (node.metadata?.isBackendFile) color = "#2ea043";
          else if (node.metadata?.isTestFile) color = "#d2a8ff";

          const nodeSize = node.type === "folder" ? Math.max(8, node.val) : Math.max(4, node.val);
          const r = Math.sqrt(nodeSize) * 1.5; // Radius approx

          ctx.beginPath();
          if (node.type === "folder") {
            // Draw square for folder
            ctx.rect(node.x - r, node.y - r, r * 2, r * 2);
          } else {
            // Draw circle for file
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
          }
          ctx.fillStyle = color;
          ctx.fill();

          // Highlight selection
          if (node.id === hoverNode?.id) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5 / globalScale;
            ctx.stroke();
          }

          // Draw Text Label below node if zoomed in, or if it's a major folder
          if (globalScale >= 1.2 || node.type === "folder") {
            const textY = node.y + r + fontSize / 2 + 2;
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = node.type === "folder" ? '#e3b341' : '#8b949e';
            ctx.fillText(label, node.x, textY);
          }

          // If it's a folder, explicitly draw +/- icon in the center of the square
          if (node.type === "folder") {
            ctx.fillStyle = '#1e1e1e';
            ctx.font = `bold ${Math.max(fontSize * 1.2, r * 1.5)}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(collapsedFolders.has(node.id) ? '+' : '−', node.x, node.y);
          }
        }}

        linkDirectionalArrowLength={(link: any) => link.label === "contains" ? 0 : 3.5}
        linkDirectionalArrowRelPos={1}
        linkColor={(link: any) => link.label === "contains" ? "rgba(139, 148, 158, 0.2)" : "rgba(88, 166, 255, 0.5)"}

        // Custom canvas draw for edge labels
        linkCanvasObjectMode={() => 'after'}
        linkCanvasObject={(link: any, ctx, globalScale) => {
          const MAX_FONT_SIZE = 4;
          const LABEL_NODE_MARGIN = 4;

          const start = link.source;
          const end = link.target;

          // Ignore unbound links
          if (typeof start !== 'object' || typeof end !== 'object') return;

          // Never show cluttered label text for hierarchy links
          if (link.label === "contains") return;

          const textPos = { x: start.x + (end.x - start.x) / 2, y: start.y + (end.y - start.y) / 2 };
          const relLink = { x: end.x - start.x, y: end.y - start.y };
          const maxTextLength = Math.sqrt(Math.pow(relLink.x, 2) + Math.pow(relLink.y, 2)) - LABEL_NODE_MARGIN * 2;

          let textAngle = Math.atan2(relLink.y, relLink.x);
          if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
          if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);

          const label = link.label;
          const fontSize = Math.min(MAX_FONT_SIZE, maxTextLength / label.length);
          if (fontSize < 1) return; // Hide unreadable microscopic text

          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.fillStyle = link.label === "contains" ? "rgba(139, 148, 158, 0.7)" : "rgba(88, 166, 255, 0.9)";
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          ctx.save();
          ctx.translate(textPos.x, textPos.y);
          ctx.rotate(textAngle);
          ctx.fillText(label, 0, 0);
          ctx.restore();
        }}
        onNodeClick={handleNodeClick}
      />
    </div>
  );
}
