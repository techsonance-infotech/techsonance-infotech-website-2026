"use client";
import React from "react";
import { motion } from "motion/react";

export interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 bg-transparent pb-6"
      >
        {new Array(2).fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <div
                className="w-full max-w-xs rounded-2xl border border-gray-100/80 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-lg"
                key={i}
              >
                <div className="text-[14px] leading-relaxed font-medium text-gray-700">{text}</div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#1155CC]/10 bg-gradient-to-br from-[#1155CC] to-indigo-600 text-sm font-medium text-white select-none">
                    {name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="flex flex-col">
                    <div className="text-sm leading-5 font-medium tracking-tight text-gray-900">
                      {name}
                    </div>
                    <div className="text-[11px] leading-5 font-bold tracking-tight text-[#1155CC] uppercase">
                      {role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};
