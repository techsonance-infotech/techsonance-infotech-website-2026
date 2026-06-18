"use client";
import React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";

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

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 1], [0.2, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 1], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 1], [-700, 500]),
    springConfig
  );
  return (
    <div
      ref={ref}
      className="h-[225vh] py-20 overflow-hidden antialiased relative flex flex-col self-auto bg-[#FAFBFD] [perspective:1000px] [transform-style:preserve-3d]"
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
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 mb-20">
          {firstRow.map((product, idx) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
              priority={idx < 2}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row mb-20 space-x-20">
          {secondRow.map((product, idx) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.title}
              priority={idx < 2}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20">
          {thirdRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = () => {
  return (
    <div className="w-full relative z-30">
      <div className="max-w-7xl mx-auto py-12 md:py-20 px-6 md:px-12 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 bg-white/70 border border-[#1155CC]/10 rounded-full px-4.5 py-1.5 mb-6 relative z-10 backdrop-blur-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-[#22B6F6] animate-pulse" />
          <span className="text-[10px] font-black text-[#1155CC] tracking-widest uppercase">Our Capabilities</span>
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-black leading-[1.08] mb-6 tracking-tight relative z-10">
          Engineering the <span className="bg-gradient-to-r from-[#1155CC] to-[#22B6F6] bg-clip-text text-transparent">Future</span> <br /> of Your Business.
        </h1>
        <p className="max-w-2xl text-sm md:text-base lg:text-lg text-black relative z-10 font-semibold leading-relaxed">
          From concept to deployment, we build high-performance software engineering and AI automation solutions that scale.
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
      className="group/product h-80 w-[26rem] relative flex-shrink-0"
    >
      <Link
        href={product.link}
        className="block group-hover/product:shadow-2xl w-full h-full relative"
      >
        <Image
          src={product.thumbnail}
          height="600"
          width="600"
          className="object-cover object-left-top absolute h-full w-full inset-0 rounded-2xl border border-gray-200/80 shadow-md bg-white"
          alt={product.title}
          priority={priority}
        />
      </Link>
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-40 bg-black pointer-events-none rounded-2xl transition-opacity duration-300"></div>
      <h2 className="absolute bottom-4 left-4 opacity-0 group-hover/product:opacity-100 text-white font-bold text-lg bg-black/60 px-3 py-1.5 rounded-xl backdrop-blur-sm transition-opacity duration-300">
        {product.title}
      </h2>
    </motion.div>
  );
};
