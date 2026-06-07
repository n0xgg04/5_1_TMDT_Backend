import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: "25%",
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L3 9L12 14L21 9L12 2Z"
            fill="#3dc5ac"
            stroke="#75dec9"
            strokeWidth="1"
          />
          <path
            d="M12 14L3 9V17L12 22L21 17V9L12 14Z"
            fill="#2aa08a"
            stroke="#3dc5ac"
            strokeWidth="1"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
