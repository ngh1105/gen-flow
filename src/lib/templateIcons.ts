import type { ComponentType } from "react";
import {
  Briefcase,
  FlaskConical,
  Gamepad2,
  HardDrive,
  Landmark,
  Puzzle,
  Scale,
  Shield,
  TrendingUp,
  Trophy,
  Vote,
} from "lucide-react";

export const TEMPLATE_ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  Scale,
  Vote,
  TrendingUp,
  Shield,
  HardDrive,
  Trophy,
  Gamepad2,
  Puzzle,
  Landmark,
  Briefcase,
  FlaskConical,
};
