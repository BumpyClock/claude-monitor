interface ChartPoint {
  x: number;
  y: number;
  value: number;
  color?: string;
}

interface ChartOptions {
  width: number;
  height: number;
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  barWidth?: number;
  barGap?: number;
  animationDuration?: number;
  colors?: {
    primary?: string;
    secondary?: string;
    grid?: string;
    text?: string;
  };
}

export class ChartRenderer {
  private ctx: CanvasRenderingContext2D;
  private options: Required<ChartOptions>;
  private animationFrame?: number;
  
  constructor(canvas: HTMLCanvasElement, options: ChartOptions) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    
    this.ctx = ctx;
    this.options = {
      width: options.width,
      height: options.height,
      padding: {
        top: options.padding?.top ?? 10,
        right: options.padding?.right ?? 10,
        bottom: options.padding?.bottom ?? 10,
        left: options.padding?.left ?? 10
      },
      barWidth: options.barWidth ?? 4,
      barGap: options.barGap ?? 2,
      animationDuration: options.animationDuration ?? 300,
      colors: {
        primary: options.colors?.primary ?? '#3b82f6',
        secondary: options.colors?.secondary ?? '#60a5fa',
        grid: options.colors?.grid ?? '#e5e7eb',
        text: options.colors?.text ?? '#6b7280'
      }
    };
    
    this.setupCanvas();
  }
  
  private setupCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    
    this.ctx.canvas.width = this.options.width * dpr;
    this.ctx.canvas.height = this.options.height * dpr;
    this.ctx.canvas.style.width = `${this.options.width}px`;
    this.ctx.canvas.style.height = `${this.options.height}px`;
    
    this.ctx.scale(dpr, dpr);
  }
  
  clear(): void {
    this.ctx.clearRect(0, 0, this.options.width, this.options.height);
  }
  
  drawBars(data: ChartPoint[], animated = true): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    const startTime = Date.now();
    const duration = animated ? this.options.animationDuration : 0;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = this.easeOutCubic(progress);
      
      this.clear();
      this.drawGrid();
      
      data.forEach((point, index) => {
        const barHeight = point.y * easeProgress;
        const x = point.x;
        const y = this.options.height - this.options.padding.bottom - barHeight;
        
        // Draw bar with gradient
        const gradient = this.ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, point.color || this.options.colors.primary);
        gradient.addColorStop(1, point.color || this.options.colors.secondary);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
          x - this.options.barWidth / 2,
          y,
          this.options.barWidth,
          barHeight
        );
        
        // Draw value label if bar is tall enough
        if (barHeight > 20 && point.value > 0) {
          this.ctx.fillStyle = this.options.colors.text;
          this.ctx.font = '10px system-ui';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(
            point.value.toString(),
            x,
            y - 5
          );
        }
      });
      
      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  drawLine(points: ChartPoint[], animated = true): void {
    if (points.length < 2) return;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    const startTime = Date.now();
    const duration = animated ? this.options.animationDuration : 0;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = this.easeOutCubic(progress);
      
      this.clear();
      this.drawGrid();
      
      // Draw line
      this.ctx.strokeStyle = this.options.colors.primary;
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      this.ctx.beginPath();
      
      const visiblePoints = Math.floor(points.length * easeProgress);
      
      points.slice(0, visiblePoints + 1).forEach((point, index) => {
        const x = point.x;
        const y = this.options.height - this.options.padding.bottom - point.y;
        
        if (index === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      });
      
      this.ctx.stroke();
      
      // Draw points
      points.slice(0, visiblePoints + 1).forEach((point) => {
        const x = point.x;
        const y = this.options.height - this.options.padding.bottom - point.y;
        
        this.ctx.fillStyle = this.options.colors.primary;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 3, 0, Math.PI * 2);
        this.ctx.fill();
      });
      
      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  private drawGrid(): void {
    const { padding, width, height, colors } = this.options;
    
    this.ctx.strokeStyle = colors.grid;
    this.ctx.lineWidth = 0.5;
    
    // Draw horizontal lines
    const rows = 5;
    for (let i = 0; i <= rows; i++) {
      const y = padding.top + (height - padding.top - padding.bottom) * (i / rows);
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, y);
      this.ctx.lineTo(width - padding.right, y);
      this.ctx.stroke();
    }
  }
  
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
  
  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.clear();
  }
}