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
        className="flex flex-col gap-6 pb-6 bg-transparent"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div className="p-8 rounded-2xl border border-gray-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-xs w-full bg-white hover:shadow-lg transition-shadow duration-300" key={i}>
                  <div className="text-gray-700 text-[14px] leading-relaxed font-medium">{text}</div>
                  <div className="flex items-center gap-3 mt-6">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1155CC] to-indigo-600 text-white flex items-center justify-center font-medium text-sm border border-[#1155CC]/10 select-none shrink-0">
                      {name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div className="flex flex-col">
                      <div className="font-medium text-gray-900 tracking-tight leading-5 text-sm">{name}</div>
                      <div className="leading-5 text-[11px] text-[#1155CC] font-bold tracking-tight uppercase">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
