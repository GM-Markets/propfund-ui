"use client";

import dynamic from "next/dynamic";

/**
 * QR rendering is only ever needed once a deposit or wallet panel is open, so
 * the encoder is kept out of every route's first load. The wrapper reserves the
 * final size, so the code appearing never shifts anything around it.
 */
const QrCode = dynamic(() => import("qrcode.react").then((m) => m.QRCodeSVG), { ssr: false });

export function AddressQr({ value, size, label }: { value: string; size: number; label: string }) {
  return (
    <span className="block" style={{ width: size, height: size }}>
      <QrCode value={value} size={size} aria-label={label} />
    </span>
  );
}
