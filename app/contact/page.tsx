import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us | TechSonance - Custom Software & AI Engineering Partner",
  description: "Get in touch with TechSonance. Share your requirements for custom software, web applications, SaaS platforms, or AI automation systems, and receive a response within 24 hours.",
};

export default function ContactPage() {
  return <ContactClient />;
}
