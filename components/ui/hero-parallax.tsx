"use client";
import React from "react";
import type { MotionValue } from "motion/react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import SafeImage from "@/app/components/SafeImage";

export const HeroParallax = ({
  products,
}: {
  products: {
    title: string;
    link: string;
    thumbnail: string;
  }[];
}) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1000]), springConfig);
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig,
  );
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 1], [15, 0]), springConfig);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 1], [0.2, 1]), springConfig);
  const rotateZ = useSpring(useTransform(scrollYProgress, [0, 1], [20, 0]), springConfig);
  const translateY = useSpring(useTransform(scrollYProgress, [0, 1], [-700, 500]), springConfig);
  return (
    <div
      ref={ref}
      className="relative flex h-[225vh] flex-col self-auto overflow-hidden bg-[#FAFBFD] py-20 antialiased [perspective:1000px] [transform-style:preserve-3d]"
    >
      {/* Full-hero gradient — spans header + upper parallax, fades into page bg */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-[min(85vh,780px)] bg-gradient-to-b from-[#E6EDF5] via-[#F3F8FD] to-[#F8FBFF]"
        aria-hidden
      />
      <Header />
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className="relative z-10"
      >
        <motion.div className="mb-20 flex flex-row-reverse space-x-20 space-x-reverse">
          {firstRow.map((product, idx) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
              priority={idx < 2}
            />
          ))}
        </motion.div>
        <motion.div className="mb-20 flex flex-row space-x-20">
          {secondRow.map((product, idx) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.title}
              priority={idx < 2}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-20 space-x-reverse">
          {thirdRow.map((product) => (
            <ProductCard product={product} translate={translateX} key={product.title} />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = () => {
  return (
    <div className="relative z-30 w-full">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-12 text-center md:px-12 md:py-20">
        <div className="relative z-10 mb-6 inline-flex items-center gap-2 rounded-full border border-[#1155CC]/10 bg-white/70 px-4.5 py-1.5 backdrop-blur-sm">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#22B6F6]" />
          <span className="text-[10px] font-black tracking-widest text-[#1155CC] uppercase">
            Our Capabilities
          </span>
        </div>
        <h1 className="relative z-10 mb-4 text-4xl leading-[1.1] font-black tracking-tight text-black md:text-5xl lg:text-6xl">
          Custom Software, AI and{" "}
          <span className="bg-gradient-to-r from-[#1155CC] to-[#22B6F6] bg-clip-text text-transparent">
            Cloud Engineering
          </span>{" "}
          Services
        </h1>
        <p className="relative z-10 mb-3 max-w-2xl text-base font-semibold text-slate-800 md:text-lg lg:text-xl">
          Engineering the Future of Your Business.
        </p>
        <p className="relative z-10 max-w-2xl text-sm leading-relaxed font-medium font-semibold text-black md:text-base lg:text-lg">
          From concept to deployment, we build high-performance software engineering and AI
          automation solutions that scale.
        </p>
      </div>
    </div>
  );
};

export const ProductCard = ({
  product,
  translate,
  priority = false,
}: {
  product: {
    title: string;
    link: string;
    thumbnail: string;
  };
  translate: MotionValue<number>;
  priority?: boolean;
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -20,
      }}
      key={product.title}
      className="group/product relative h-80 w-[26rem] flex-shrink-0"
    >
      <Link
        href={product.link}
        className="relative block h-full w-full group-hover/product:shadow-2xl"
      >
        <SafeImage
          src={product.thumbnail}
          height="600"
          width="600"
          className="absolute inset-0 h-full w-full rounded-2xl border border-gray-200/80 bg-white object-cover object-left-top shadow-md"
          alt={product.title}
          priority={priority}
        />
      </Link>
      <div className="pointer-events-none absolute inset-0 h-full w-full rounded-2xl bg-black opacity-0 transition-opacity duration-300 group-hover/product:opacity-40"></div>
      <h2 className="absolute bottom-4 left-4 rounded-xl bg-black/60 px-3 py-1.5 text-lg font-bold text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover/product:opacity-100">
        {product.title}
      </h2>
    </motion.div>
  );
};
