import React, { useRef, useEffect, useState, useMemo } from 'react';
import { BoundingBox } from '../../hooks/useVisionStudio';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Info, 
  Check, 
  Copy, 
  Volume2, 
  Crop, 
  MessageSquare, 
  ChevronRight, 
  X, 
  Layers, 
  CheckSquare, 
  Square, 
  Download, 
  SlidersHorizontal,
  Sparkles,
  Maximize2
} from 'lucide-react';

interface Props {
  imageSrc: string;
  boxes?: BoundingBox[];
  selectedBox?: BoundingBox | null;
  selectedBoxes?: BoundingBox[];
  onSelectBox?: (box: BoundingBox | null) => void;
  onSelectMultipleBoxes?: (boxes: BoundingBox[]) => void;
  onAskAboutObject?: (box: BoundingBox) => void;
  onCropObject?: (croppedBase64: string, box: BoundingBox) => void;
}

export const InteractiveCanvas: React.FC<Props> = ({
  imageSrc,
  boxes = [],
  selectedBox,
  selectedBoxes: externalSelectedBoxes,
  onSelectBox,
  onSelectMultipleBoxes,
  onAskAboutObject,
  onCropObject,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Zoom & View state
  const [zoom, setZoom] = useState<number>(1);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Multi-selection state
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  
  // Focused singular box for deep metadata inspection
  const [focusedBox, setFocusedBox] = useState<BoundingBox | null>(null);
  const [hoveredBox, setHoveredBox] = useState<BoundingBox | null>(null);
  
  // Sidebar Inspector & Tooltip UI visibility
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [tooltipState, setTooltipState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    box: BoundingBox | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    box: null,
  });

  // Snapshot preview of focused object crop
  const [croppedSnapshot, setCroppedSnapshot] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Sync external selectedBox or selectedBoxes with internal selection
  useEffect(() => {
    if (selectedBox) {
      setFocusedBox(selectedBox);
      const boxId = selectedBox.id || selectedBox.label;
      setInternalSelectedIds(new Set([boxId]));
      setIsInspectorOpen(true);
    }
  }, [selectedBox]);

  useEffect(() => {
    if (externalSelectedBoxes && externalSelectedBoxes.length > 0) {
      const ids = new Set(externalSelectedBoxes.map((b) => b.id || b.label));
      setInternalSelectedIds(ids);
      if (!focusedBox && externalSelectedBoxes[0]) {
        setFocusedBox(externalSelectedBoxes[0]);
      }
    }
  }, [externalSelectedBoxes]);

  // Determine active selected boxes list
  const activeSelectedBoxes = useMemo(() => {
    return boxes.filter((b) => internalSelectedIds.has(b.id || b.label));
  }, [boxes, internalSelectedIds]);

  // Generate crop snapshot whenever focusedBox changes
  useEffect(() => {
    if (!focusedBox || !imageSrc || imageDimensions.width === 0) {
      setCroppedSnapshot(null);
      return;
    }

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const [ymin, xmin, ymax, xmax] = focusedBox.box_2d;
      const x = (xmin / 1000) * img.width;
      const y = (ymin / 1000) * img.height;
      const w = Math.max(10, ((xmax - xmin) / 1000) * img.width);
      const h = Math.max(10, ((ymax - ymin) / 1000) * img.height);

      const offCanvas = document.createElement('canvas');
      offCanvas.width = w;
      offCanvas.height = h;
      const offCtx = offCanvas.getContext('2d');
      if (offCtx) {
        offCtx.drawImage(img, x, y, w, h, 0, 0, w, h);
        const dataUrl = offCanvas.toDataURL('image/jpeg', 0.92);
        setCroppedSnapshot(dataUrl);
      }
    };
  }, [focusedBox, imageSrc, imageDimensions]);

  // Render HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      setImageDimensions({ width: img.width, height: img.height });
      ctx.drawImage(img, 0, 0);

      // Render Bounding Boxes
      boxes.forEach((item, index) => {
        const [ymin, xmin, ymax, xmax] = item.box_2d;
        const x = (xmin / 1000) * img.width;
        const y = (ymin / 1000) * img.height;
        const w = ((xmax - xmin) / 1000) * img.width;
        const h = ((ymax - ymin) / 1000) * img.height;

        const boxKey = item.id || item.label;
        const isFocused = focusedBox && (focusedBox.id || focusedBox.label) === boxKey;
        const isSelected = internalSelectedIds.has(boxKey);
        const isHovered = hoveredBox && (hoveredBox.id || hoveredBox.label) === boxKey;

        // Visual styles
        let strokeColor = '#10B981'; // Emerald default
        let fillColor = 'transparent';

        if (isFocused) {
          strokeColor = '#F59E0B'; // Amber Gold for focused
          fillColor = 'rgba(245, 158, 11, 0.22)';
        } else if (isSelected) {
          strokeColor = '#0EA5E9'; // Sky Blue for multi-selected
          fillColor = 'rgba(14, 165, 233, 0.16)';
        } else if (isHovered) {
          strokeColor = '#A855F7'; // Purple for hovered
          fillColor = 'rgba(168, 85, 247, 0.12)';
        }

        // Fill background highlight
        if (fillColor !== 'transparent') {
          ctx.fillStyle = fillColor;
          ctx.fillRect(x, y, w, h);
        }

        // Draw boundary
        const baseLineWidth = Math.max(3, img.width * 0.0035);
        ctx.lineWidth = isFocused || isHovered ? baseLineWidth * 1.6 : baseLineWidth;
        ctx.strokeStyle = strokeColor;
        ctx.strokeRect(x, y, w, h);

        // Corner brackets / accent points for focused box
        if (isFocused) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = baseLineWidth * 1.8;
          const cornerLen = Math.min(24, Math.min(w, h) * 0.25);
          
          // Top-left corner
          ctx.beginPath();
          ctx.moveTo(x, y + cornerLen);
          ctx.lineTo(x, y);
          ctx.lineTo(x + cornerLen, y);
          ctx.stroke();

          // Bottom-right corner
          ctx.beginPath();
          ctx.moveTo(x + w, y + h - cornerLen);
          ctx.lineTo(x + w, y + h);
          ctx.lineTo(x + w - cornerLen, y + h);
          ctx.stroke();
        }

        // Label Badge
        const fontSize = Math.max(13, Math.min(22, img.width * 0.016));
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
        const labelText = `#${index + 1} ${item.label}`;
        const metrics = ctx.measureText(labelText);
        const badgeHeight = fontSize + 10;
        const badgeWidth = metrics.width + 16;

        ctx.fillStyle = isFocused ? '#F59E0B' : isSelected ? '#0284C7' : isHovered ? '#7E22CE' : '#10B981';
        const labelY = Math.max(0, y - badgeHeight);
        ctx.fillRect(x, labelY, badgeWidth, badgeHeight);

        // Label Text
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(labelText, x + 8, labelY + fontSize + 1);
      });
    };
  }, [imageSrc, boxes, focusedBox, internalSelectedIds, hoveredBox]);

  // Hit-test helper: returns the top-most box at canvas pixel coords
  const hitTestBox = (clickX: number, clickY: number): BoundingBox | null => {
    const canvas = canvasRef.current;
    if (!canvas || boxes.length === 0) return null;

    for (let i = boxes.length - 1; i >= 0; i--) {
      const box = boxes[i];
      const [ymin, xmin, ymax, xmax] = box.box_2d;
      const x = (xmin / 1000) * canvas.width;
      const y = (ymin / 1000) * canvas.height;
      const w = ((xmax - xmin) / 1000) * canvas.width;
      const h = ((ymax - ymin) / 1000) * canvas.height;

      if (clickX >= x && clickX <= x + w && clickY >= y && clickY <= y + h) {
        return box;
      }
    }
    return null;
  };

  // Canvas Mouse Move: Hover detection and dynamic tooltip positioning
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || boxes.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const hit = hitTestBox(canvasX, canvasY);

    if (hit) {
      setHoveredBox(hit);
      const containerRect = container.getBoundingClientRect();
      const tooltipX = Math.min(containerRect.width - 240, Math.max(20, e.clientX - containerRect.left));
      const tooltipY = Math.max(20, e.clientY - containerRect.top - 80);

      setTooltipState({
        visible: true,
        x: tooltipX,
        y: tooltipY,
        box: hit,
      });
    } else {
      setHoveredBox(null);
      if (!focusedBox) {
        setTooltipState((prev) => ({ ...prev, visible: false }));
      }
    }
  };

  // Canvas Click: Multi-object and singular object selection logic
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || boxes.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const hit = hitTestBox(clickX, clickY);

    if (hit) {
      const boxKey = hit.id || hit.label;
      setFocusedBox(hit);

      if (isMultiSelectMode || e.shiftKey || e.ctrlKey || e.metaKey) {
        // Multi-select toggle
        setInternalSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(boxKey)) {
            next.delete(boxKey);
          } else {
            next.add(boxKey);
          }
          const updated = boxes.filter((b) => next.has(b.id || b.label));
          if (onSelectMultipleBoxes) onSelectMultipleBoxes(updated);
          return next;
        });
      } else {
        // Singular selection
        setInternalSelectedIds(new Set([boxKey]));
        if (onSelectBox) onSelectBox(hit);
      }

      setIsInspectorOpen(true);
    } else {
      // Clicked outside on empty canvas space
      if (!isMultiSelectMode && !e.shiftKey) {
        setFocusedBox(null);
        setInternalSelectedIds(new Set());
        setTooltipState((prev) => ({ ...prev, visible: false }));
        if (onSelectBox) onSelectBox(null);
      }
    }
  };

  // Helper calculations for singular metadata display
  const getBoxMetrics = (box: BoundingBox) => {
    const [ymin, xmin, ymax, xmax] = box.box_2d;
    const imgW = imageDimensions.width || 1000;
    const imgH = imageDimensions.height || 1000;

    const pixelW = Math.round(((xmax - xmin) / 1000) * imgW);
    const pixelH = Math.round(((ymax - ymin) / 1000) * imgH);
    const pixelX = Math.round((xmin / 1000) * imgW);
    const pixelY = Math.round((ymin / 1000) * imgH);

    const areaCoverage = (((xmax - xmin) * (ymax - ymin)) / (1000 * 1000)) * 100;
    const aspectRatio = pixelH > 0 ? (pixelW / pixelH).toFixed(2) : '1.00';

    // Spatial Sector Determination
    const midX = (xmin + xmax) / 2;
    const midY = (ymin + ymax) / 2;
    let sector = 'মাঝখানে (Center)';
    if (midY < 333) {
      sector = midX < 333 ? 'শীর্ষ-বামে (Top-Left)' : midX > 666 ? 'শীর্ষ-ডানে (Top-Right)' : 'শীর্ষ-মাঝখানে (Top-Center)';
    } else if (midY > 666) {
      sector = midX < 333 ? 'নিচ-বামে (Bottom-Left)' : midX > 666 ? 'নিচ-ডানে (Bottom-Right)' : 'নিচ-মাঝখানে (Bottom-Center)';
    } else {
      sector = midX < 333 ? 'বাম পাশে (Mid-Left)' : midX > 666 ? 'ডান পাশে (Mid-Right)' : 'কেন্দ্রস্থলে (Center)';
    }

    return { pixelX, pixelY, pixelW, pixelH, areaCoverage: areaCoverage.toFixed(1), aspectRatio, sector };
  };

  // Multi-select bulk actions
  const handleSelectAll = () => {
    const allIds = new Set(boxes.map((b) => b.id || b.label));
    setInternalSelectedIds(allIds);
    if (boxes[0]) setFocusedBox(boxes[0]);
    if (onSelectMultipleBoxes) onSelectMultipleBoxes(boxes);
  };

  const handleClearSelection = () => {
    setInternalSelectedIds(new Set());
    setFocusedBox(null);
    setTooltipState((prev) => ({ ...prev, visible: false }));
    if (onSelectBox) onSelectBox(null);
    if (onSelectMultipleBoxes) onSelectMultipleBoxes([]);
  };

  // Text-to-Speech for object label
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-BD';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Copy helper
  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Crop & Download singular snapshot
  const handleDownloadCrop = () => {
    if (!croppedSnapshot || !focusedBox) return;
    const a = document.createElement('a');
    a.href = croppedSnapshot;
    a.download = `crop_${focusedBox.label.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
    a.click();

    if (onCropObject) {
      onCropObject(croppedSnapshot, focusedBox);
    }
  };

  const activeBoxMetrics = focusedBox ? getBoxMetrics(focusedBox) : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 flex flex-col items-center justify-center select-none"
    >
      {/* Top Controls Toolbar */}
      <div className="w-full px-4 py-2.5 bg-stone-900/90 border-b border-stone-800/90 flex flex-wrap items-center justify-between gap-2.5 z-20 backdrop-blur-md">
        
        {/* Left: Multi-select status & Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isMultiSelectMode
                ? 'bg-sky-600 text-white border-sky-400 shadow-sm'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
            }`}
            title="মাল্টি-সিলেকশন মোড চালু/বন্ধ করুন"
          >
            {isMultiSelectMode ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            <span>মাল্টি-সিলেক্ট মোড</span>
          </button>

          {boxes.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
              >
                সব সিলেক্ট ({boxes.length})
              </button>
              {internalSelectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-stone-800 hover:bg-stone-700 text-rose-300 transition-colors cursor-pointer"
                >
                  ক্লিয়ার ({internalSelectedIds.size})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Zoom controls & Inspector Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
            className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
            title="জুম ইন"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
            className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
            title="জুম আউট"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
            title="রিসেট জুম"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-stone-700 mx-1" />

          {/* Inspector Panel Toggle Button */}
          <button
            type="button"
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isInspectorOpen
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
            }`}
            title="অবজেক্ট মেটাডেটা সাইডবার প্যানেল খুলুন/বন্ধ করুন"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>মেটাডেটা প্যানেল</span>
          </button>
        </div>
      </div>

      {/* Main Visual Workspace Area */}
      <div className="relative w-full flex-1 flex overflow-hidden min-h-[460px]">
        
        {/* Canvas Display Viewport */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto relative">
          <div
            className="flex items-center justify-center transition-transform duration-150"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              className="max-w-full h-auto object-contain rounded-xl shadow-2xl cursor-crosshair border border-stone-800/80"
            />
          </div>

          {/* Dynamic Floating Tooltip On Canvas */}
          {tooltipState.visible && tooltipState.box && (
            <div
              className="absolute z-30 pointer-events-auto bg-stone-950/95 backdrop-blur-md border border-amber-500/40 text-stone-100 p-2.5 rounded-xl shadow-2xl text-xs flex flex-col gap-1.5 max-w-xs animate-in fade-in zoom-in-95 duration-150"
              style={{
                left: `${tooltipState.x}px`,
                top: `${tooltipState.y}px`,
              }}
            >
              <div className="flex items-center justify-between gap-3 pb-1 border-b border-stone-800">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[150px]">{tooltipState.box.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTooltipState((prev) => ({ ...prev, visible: false }))}
                  className="text-stone-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-[11px] text-stone-400 font-mono space-y-0.5">
                <div>Coords: [{tooltipState.box.box_2d.join(', ')}]</div>
                {imageDimensions.width > 0 && (
                  <div>
                    Dimensions: {Math.round(((tooltipState.box.box_2d[3] - tooltipState.box.box_2d[1]) / 1000) * imageDimensions.width)} × {Math.round(((tooltipState.box.box_2d[2] - tooltipState.box.box_2d[0]) / 1000) * imageDimensions.height)} px
                  </div>
                )}
              </div>

              {/* Quick Actions in Tooltip */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-stone-800/80">
                <button
                  type="button"
                  onClick={() => speakText(tooltipState.box!.label)}
                  className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
                  title="উচ্চারণ শুনুন"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFocusedBox(tooltipState.box);
                    setIsInspectorOpen(true);
                  }}
                  className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-semibold flex items-center gap-1"
                >
                  <Info className="w-3 h-3" />
                  <span>ডিটেইলস</span>
                </button>
                {onAskAboutObject && (
                  <button
                    type="button"
                    onClick={() => onAskAboutObject(tooltipState.box!)}
                    className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-semibold flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>এআই প্রশ্ন</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Deep Metadata Inspector Sidebar Panel */}
        {isInspectorOpen && (
          <aside className="w-80 md:w-96 bg-stone-900/95 border-l border-stone-800 p-4 flex flex-col gap-4 overflow-y-auto max-h-[550px] shadow-2xl z-20 backdrop-blur-md animate-in slide-in-from-right duration-200">
            
            {/* Inspector Header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">
                  অবজেক্ট মেটাডেটা ইনস্পেক্টর
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectorOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
                title="প্যানেল বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selection Status Badge */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-stone-950/60 border border-stone-800 text-[11px] font-mono">
              <span className="text-stone-400">নির্বাচিত অবজেক্ট:</span>
              <span className="font-bold text-sky-400">
                {internalSelectedIds.size} / {boxes.length} টি
              </span>
            </div>

            {/* Detailed Singular Object Inspection */}
            {focusedBox && activeBoxMetrics ? (
              <div className="flex flex-col gap-3.5">
                
                {/* Object Crop Preview Card */}
                <div className="rounded-2xl border border-stone-800 bg-stone-950 p-2.5 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-2 px-1">
                    <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                      ক্রপ প্রিভিউ (Singular ROI)
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadCrop}
                      className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-medium"
                      title="এই অবজেক্টের ছবি ডাউনলোড করুন"
                    >
                      <Download className="w-3 h-3" />
                      <span>ডাউনলোড</span>
                    </button>
                  </div>
                  {croppedSnapshot ? (
                    <img
                      src={croppedSnapshot}
                      alt={focusedBox.label}
                      className="max-h-36 object-contain rounded-lg border border-stone-800/80 shadow-md"
                    />
                  ) : (
                    <div className="h-28 flex items-center justify-center text-stone-600 text-[11px]">
                      প্রিভিউ প্রস্তুত হচ্ছে...
                    </div>
                  )}
                </div>

                {/* Primary Identifiers */}
                <div className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 uppercase font-semibold">লেবেল / নাম</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => speakText(focusedBox.label)}
                        className="text-stone-400 hover:text-amber-400"
                        title="উচ্চারণ"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyText(focusedBox.label, 'label')}
                        className="text-stone-400 hover:text-amber-400"
                        title="কপি"
                      >
                        {copiedKey === 'label' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-stone-100">{focusedBox.label}</div>
                  
                  {focusedBox.category && (
                    <div className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      ক্যাটেগরি: {focusedBox.category}
                    </div>
                  )}
                </div>

                {/* Spatial & Geometric Meta-Data Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800">
                    <span className="text-stone-500 block text-[10px]">পিক্সেল ডাইমেনশন</span>
                    <span className="font-mono font-bold text-stone-200">
                      {activeBoxMetrics.pixelW} × {activeBoxMetrics.pixelH} px
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800">
                    <span className="text-stone-500 block text-[10px]">অ্যাসপেক্ট রেশিও</span>
                    <span className="font-mono font-bold text-stone-200">
                      {activeBoxMetrics.aspectRatio} : 1
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800">
                    <span className="text-stone-500 block text-[10px]">ছবির কভারেজ</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {activeBoxMetrics.areaCoverage}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800">
                    <span className="text-stone-500 block text-[10px]">অবস্থান সেক্টর</span>
                    <span className="font-semibold text-stone-200 truncate block">
                      {activeBoxMetrics.sector}
                    </span>
                  </div>
                </div>

                {/* Raw Normalized Coordinates */}
                <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-stone-400 text-[10px] mb-1">
                    <span>নরমালাইজড কোঅর্ডিনেট [ymin, xmin, ymax, xmax]</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(JSON.stringify(focusedBox.box_2d), 'coords')}
                      className="text-stone-400 hover:text-white"
                      title="স্থানাঙ্ক কপি"
                    >
                      {copiedKey === 'coords' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="text-amber-300 font-bold">
                    [{focusedBox.box_2d.join(', ')}]
                  </div>
                </div>

                {/* Action Buttons for Singular Object */}
                <div className="flex flex-col gap-2 pt-1">
                  {onAskAboutObject && (
                    <button
                      type="button"
                      onClick={() => onAskAboutObject(focusedBox)}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>এই অবজেক্ট নিয়ে এআই-কে প্রশ্ন করুন</span>
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => handleCopyText(JSON.stringify(focusedBox, null, 2), 'all_json')}
                    className="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'all_json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>সম্পূর্ণ JSON মেটাডেটা কপি করুন</span>
                  </button>
                </div>
              </div>
            ) : (
              /* No Singular Object Focused */
              <div className="p-6 text-center text-stone-500 text-xs leading-relaxed border border-dashed border-stone-800 rounded-2xl">
                ক্যানভাসে যেকোনো বাউন্ডিং বক্সে ক্লিক করে তার পূর্ণাঙ্গ মেটাডেটা, ডাইমেনশন ও ক্রপ স্ন্যাপশট দেখুন।
              </div>
            )}

            {/* List of Other Detected Objects */}
            {boxes.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-stone-800">
                <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400">
                  <span>সকল ডিটেক্টেড অবজেক্ট ({boxes.length})</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {boxes.map((b, idx) => {
                    const bKey = b.id || b.label;
                    const isBSelected = internalSelectedIds.has(bKey);
                    const isBFocused = focusedBox && (focusedBox.id || focusedBox.label) === bKey;

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setFocusedBox(b);
                          if (!isMultiSelectMode) {
                            setInternalSelectedIds(new Set([bKey]));
                            if (onSelectBox) onSelectBox(b);
                          }
                        }}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between text-xs ${
                          isBFocused
                            ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                            : isBSelected
                            ? 'bg-sky-950/40 border-sky-500/50 text-sky-200'
                            : 'bg-stone-950/40 border-stone-800/80 hover:border-stone-700 text-stone-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] text-stone-500">#{idx + 1}</span>
                          <span className="font-medium truncate">{b.label}</span>
                        </div>
                        <span className="font-mono text-[10px] text-stone-500 shrink-0">
                          [{b.box_2d[0]}, {b.box_2d[1]}]
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Footer Summary status bar */}
      {boxes.length > 0 && (
        <div className="w-full px-4 py-2 bg-stone-900/80 border-t border-stone-800/80 flex flex-wrap items-center justify-between text-[11px] text-stone-400 font-mono">
          <div className="flex items-center gap-3">
            <span>মোট {boxes.length} টি অবজেক্ট বাউন্ডিং বক্স</span>
            {internalSelectedIds.size > 0 && (
              <span className="text-amber-400 font-semibold">
                • {internalSelectedIds.size} টি নির্বাচিত
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-stone-500">
            <span>ক্লিক করে সিঙ্গেল অবজেক্ট মেটাডেটা দেখুন • Shift+Click দিয়ে মাল্টি-সিলেক্ট</span>
          </div>
        </div>
      )}
    </div>
  );
};
