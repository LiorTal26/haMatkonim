'use client';

// ============================================
// Recipe Book — Choo Birthday Celebration Easter Egg
// ============================================

import React, { useEffect, useRef } from 'react';
import { Heart, Gift, Sparkles, X } from 'lucide-react';

interface ChooCelebrationProps {
  show: boolean;
  onClose: () => void;
}

// ─── Canvas Heart Shower ────────────────────────────────────────────────────
function HeartShower() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    class HeartParticle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      color: string;
      rotation: number;
      rotationSpeed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = -20 - Math.random() * 50;
        this.size = Math.random() * 15 + 10;
        this.speedY = Math.random() * 1.8 + 1.2;
        this.speedX = Math.sin(Math.random() * Math.PI) * 0.6;
        this.opacity = Math.random() * 0.6 + 0.4;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.015;

        // Sweet romantic color choices
        const colors = [
          'rgba(255, 46, 147, ',  // Hot pink/rose
          'rgba(255, 117, 143, ', // Light sweet pink
          'rgba(255, 77, 109, ',  // Cherry pink
          'rgba(255, 179, 193, ', // Lavender pink
          'rgba(255, 23, 68, ',   // Deep love red
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.y / 35) * 0.6;
        this.rotation += this.rotationSpeed;
        if (this.y > height + 20) {
          this.x = Math.random() * width;
          this.y = -20;
          this.speedY = Math.random() * 1.8 + 1.2;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.rotation);
        c.globalAlpha = this.opacity;
        c.fillStyle = this.color + this.opacity + ')';

        c.beginPath();
        const topCurveHeight = this.size * 0.3;
        c.moveTo(0, topCurveHeight);
        c.bezierCurveTo(
          -this.size / 2, -topCurveHeight,
          -this.size, topCurveHeight,
          0, this.size
        );
        c.bezierCurveTo(
          this.size, topCurveHeight,
          this.size / 2, -topCurveHeight,
          0, topCurveHeight
        );
        c.closePath();
        c.fill();
        c.restore();
      }
    }

    const particles: HeartParticle[] = Array.from({ length: 50 }, () => new HeartParticle());

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.update();
        p.draw(ctx);
      }
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}

// ─── Main Celebration Overlay ────────────────────────────────────────────────
export default function ChooCelebration({ show, onClose }: ChooCelebrationProps) {
  if (!show) return null;

  return (
    <>
      <HeartShower />
      <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={onClose}>
        <div
          className="modal-content animate-scale-in"
          onClick={e => e.stopPropagation()}
          style={{
            width: '90%',
            maxWidth: 480,
            background: 'linear-gradient(135deg, rgba(30, 20, 50, 0.9) 0%, rgba(20, 15, 35, 0.95) 100%)',
            border: '1px solid rgba(255, 46, 147, 0.25)',
            boxShadow: '0 0 30px rgba(255, 46, 147, 0.2), var(--shadow-lg)',
            textAlign: 'center',
            padding: 'var(--space-8) var(--space-6)',
            borderRadius: 'var(--radius-xl)',
            position: 'relative',
          }}
        >
          {/* Close button */}
          <button
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 'var(--space-4)',
              right: 'var(--space-4)',
              color: 'var(--color-text-muted)',
            }}
          >
            <X size={18} />
          </button>

          {/* Birthday Visual Header */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 46, 147, 0.15)',
              marginBottom: 'var(--space-6)',
              position: 'relative',
              boxShadow: '0 0 20px rgba(255, 46, 147, 0.2)',
            }}
          >
            <Gift size={36} style={{ color: '#FF2E93' }} />
            <Sparkles
              size={18}
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                color: '#F5A623',
                animation: 'pulse 1.5s infinite',
              }}
            />
          </div>

          {/* Greeting text */}
          <h2
            style={{
              fontSize: 'var(--text-2xl)',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              color: '#F8F8F2',
              marginBottom: 'var(--space-4)',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
            }}
          >
            יום הולדת שמח לצ'ו שלי! 🎂❤️
          </h2>

          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--text-base)',
              lineHeight: 'var(--leading-relaxed)',
              marginBottom: 'var(--space-8)',
              whiteSpace: 'pre-line',
            }}
          >
            ספר המתכונים הזה נבנה באהבה גדולה במיוחד בשבילך, כדי שנמשיך ליצור זיכרונות טעימים ביחד.
            {"\n"}
            אוהב אותך הכי בעולם, הבעלצ'ו שלך ❤️
          </p>

          {/* Action button */}
          <div className="flex justify-center">
            <button
              className="btn btn-primary"
              onClick={onClose}
              style={{
                background: 'linear-gradient(135deg, #FF2E93 0%, #FF5A76 100%)',
                borderColor: '#FF2E93',
                boxShadow: '0 0 15px rgba(255, 46, 147, 0.4)',
                padding: 'var(--space-3) var(--space-8)',
                fontWeight: 600,
              }}
            >
              תודה אהובי ❤️
            </button>
          </div>

          {/* Pinned flying hearts on sides */}
          <div
            style={{
              position: 'absolute',
              bottom: 15,
              left: 15,
              opacity: 0.15,
              color: '#FF2E93',
            }}
          >
            <Heart size={20} fill="#FF2E93" />
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 15,
              right: 15,
              opacity: 0.15,
              color: '#FF2E93',
            }}
          >
            <Heart size={20} fill="#FF2E93" />
          </div>
        </div>
      </div>
    </>
  );
}
