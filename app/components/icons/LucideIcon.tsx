"use client";

import React from "react";
import {
  Paintbrush,
  Map as MapIcon,
  Box,
  Drama,
  BarChart3,
  Lock,
  Layers,
  CreditCard,
  ZapOff,
  Smartphone,
  Key,
  WifiOff,
  X,
  Zap,
  DollarSign,
  Wrench,
  Bell,
  Ban,
  BellOff,
  Puzzle,
  Hourglass,
  Bug,
  Factory,
  FileText,
  Receipt,
  Truck,
  Radio,
  Store,
  Database,
  Plug,
  Globe,
  RefreshCw,
  TrendingUp,
  Building,
  AlertTriangle,
  Siren
} from "lucide-react";

const EMOJI_MAP: Record<string, React.ComponentType<any>> = {
  "🎨": Paintbrush,
  "🗺️": MapIcon,
  "📦": Box,
  "🎭": Drama,
  "📊": BarChart3,
  "🔒": Lock,
  "🧱": Layers,
  "💳": CreditCard,
  "🐌": ZapOff,
  "📱": Smartphone,
  "🔑": Key,
  "📵": WifiOff,
  "❌": X,
  "⚡": Zap,
  "💸": DollarSign,
  "🛠️": Wrench,
  "🔔": Bell,
  "🛑": Ban,
  "🔕": BellOff,
  "🧩": Puzzle,
  "⏳": Hourglass,
  "🐛": Bug,
  "🏭": Factory,
  "📄": FileText,
  "🧾": Receipt,
  "🚛": Truck,
  "📡": Radio,
  "🏪": Store,
  "🔐": Lock,
  "💾": Database,
  "🔌": Plug,
  "🌐": Globe,
  "🔄": RefreshCw,
  "📈": TrendingUp,
  "🏦": Building,
  "⚠️": AlertTriangle,
  "🚨": Siren,
};

export default function EmojiOrLucideIcon({
  icon,
  className = "w-5 h-5",
  size
}: {
  icon: string;
  className?: string;
  size?: number;
}) {
  const IconComponent = EMOJI_MAP[icon];
  if (IconComponent) {
    return <IconComponent className={className} size={size} />;
  }
  return <span className={className}>{icon}</span>;
}
