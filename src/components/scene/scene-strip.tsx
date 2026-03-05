"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/cn";

type SceneConfig = {
  src: string;
  heightClass: string;
  overlayClass: string;
  objectPositionClass?: string;
};

function pickScene(pathname: string | null): SceneConfig {
  const p = pathname ?? "/";

  if (p === "/") {
    return {
      src: "/scenes/sunrise-ocean.svg",
      heightClass: "h-48 sm:h-60",
      overlayClass: "from-black/25 via-black/10 to-black/0",
      objectPositionClass: "object-[center_58%]",
    };
  }

  if (p === "/login" || p === "/register") {
    return {
      src: "/scenes/dock.svg",
      heightClass: "h-36 sm:h-44",
      overlayClass: "from-black/20 via-black/5 to-black/0",
      objectPositionClass: "object-[center_56%]",
    };
  }

  if (p.startsWith("/dashboard")) {
    return {
      src: "/scenes/marina.svg",
      heightClass: "h-36 sm:h-44",
      overlayClass: "from-black/18 via-black/6 to-black/0",
      objectPositionClass: "object-[center_62%]",
    };
  }

  if (p.startsWith("/queue")) {
    return {
      src: "/scenes/waves.svg",
      heightClass: "h-32 sm:h-40",
      overlayClass: "from-black/14 via-black/5 to-black/0",
      objectPositionClass: "object-[center_64%]",
    };
  }

  if (p.startsWith("/tractor") || p.startsWith("/office") || p.startsWith("/admin")) {
    return {
      src: "/scenes/dock.svg",
      heightClass: "h-28 sm:h-36",
      overlayClass: "from-black/12 via-black/4 to-black/0",
      objectPositionClass: "object-[center_52%]",
    };
  }

  return {
    src: "/scenes/marina.svg",
    heightClass: "h-32 sm:h-40",
    overlayClass: "from-black/14 via-black/5 to-black/0",
    objectPositionClass: "object-[center_60%]",
  };
}

export function SceneStrip() {
  const pathname = usePathname();
  const scene = React.useMemo(() => pickScene(pathname), [pathname]);

  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-zinc-200 bg-white", scene.heightClass)}>
      <Image
        src={scene.src}
        alt=""
        aria-hidden="true"
        fill
        priority={pathname === "/"}
        sizes="(max-width: 1024px) 100vw, 1024px"
        className={cn("select-none object-cover", scene.objectPositionClass)}
      />
      <div aria-hidden="true" className={cn("absolute inset-0 bg-gradient-to-br", scene.overlayClass)} />
      <div aria-hidden="true" className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-white/35 blur-2xl" />
      <div aria-hidden="true" className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />
    </div>
  );
}

