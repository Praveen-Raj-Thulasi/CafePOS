import React, { useEffect, useState } from 'react';

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e) => {
      // Check if hovering over clickable elements
      if (
        e.target.tagName.toLowerCase() === 'button' ||
        e.target.tagName.toLowerCase() === 'a' ||
        e.target.tagName.toLowerCase() === 'input' ||
        e.target.tagName.toLowerCase() === 'select' ||
        e.target.closest('button') ||
        e.target.closest('a')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <>
      {/* Small dot that strictly follows mouse */}
      <div 
        style={{
          position: 'fixed',
          top: position.y,
          left: position.x,
          width: '8px',
          height: '8px',
          backgroundColor: 'var(--accent-primary)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 99999,
          transition: 'width 0.2s, height 0.2s, opacity 0.2s',
          opacity: isHovering ? 0 : 1
        }}
      />
      {/* Outer ring that lags slightly and expands on hover */}
      <div 
        style={{
          position: 'fixed',
          top: position.y,
          left: position.x,
          width: isHovering ? '50px' : '30px',
          height: isHovering ? '50px' : '30px',
          border: `2px solid ${isHovering ? 'rgba(79, 70, 229, 0.5)' : 'rgba(79, 70, 229, 0.8)'}`,
          backgroundColor: isHovering ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 99998,
          transition: 'width 0.3s ease-out, height 0.3s ease-out, background-color 0.3s, border 0.3s, top 0.1s ease-out, left 0.1s ease-out'
        }}
      />
      
      {/* Global style to hide default cursor */}
      <style>{`
        * {
          cursor: none !important;
        }
      `}</style>
    </>
  );
};

export default CustomCursor;
