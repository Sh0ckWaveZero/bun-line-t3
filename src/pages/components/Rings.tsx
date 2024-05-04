import React from "react";

interface RingProps {
  count: number;
}

const Rings: React.FC<RingProps> = ({ count }) => {
  return (
    <div className="rings" style={{ "--count": 20 } as React.CSSProperties}>
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          className="ring"
          style={
            {
              "--index": i + 1,
              "--tw-ring-color": "transparent",
            } as React.CSSProperties
          }
        ></div>
      ))}
    </div>
  );
};

export default Rings;
