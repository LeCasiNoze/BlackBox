import * as React from "react";
import QRCode from "qrcode";

export function QrCodeImage({ value, className = "" }: { value: string; className?: string }) {
  const [src, setSrc] = React.useState("");

  React.useEffect(() => {
    let active = true;
    if (!value) {
      setSrc("");
      return () => undefined;
    }
    void QRCode.toDataURL(value, {
      width: 320,
      margin: 2,
      color: { dark: "#090909", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then((url) => {
      if (active) setSrc(url);
    });
    return () => {
      active = false;
    };
  }, [value]);

  if (!src) return <div className={`animate-pulse bg-white/10 ${className}`} />;
  return <img alt="QR code vers la page Préparation vente" className={className} src={src} />;
}
