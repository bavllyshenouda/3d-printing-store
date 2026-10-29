"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Check,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSubscribed(true);
    toast.success("Subscribed!", "You're now on our studio newsletter list.");
  };

  return (
    <footer className="w-full bg-[#111318] text-white border-t border-white/10 mt-auto">
      {/* Studio Value Highlights */}
      <div className="border-b border-white/10 py-10 bg-black/30">
        <Container size="xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#FF6B35]">
                <Zap className="size-5" />
              </div>
              <div>
                <h4 className="font-heading text-sm font-bold text-white">
                  Rapid 24-48h Dispatch
                </h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Industrial Bambu X1C & Voron print farm running 24/7 for zero downtime.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#FF6B35]">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h4 className="font-heading text-sm font-bold text-white">
                  Micron-Level Dimensional Accuracy
                </h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Calibrated to ±0.1mm tolerances for flawless mechanical fitment.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#FF6B35]">
                <Layers className="size-5" />
              </div>
              <div>
                <h4 className="font-heading text-sm font-bold text-white">
                  Engineering Grade Polymers
                </h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  PETG-Carbon Fiber, Tough PLA+, High-Temp ABS, and 8K High-Resin.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#FF6B35]">
                <Phone className="size-5" />
              </div>
              <div>
                <h4 className="font-heading text-sm font-bold text-white">
                  WhatsApp Slicing Support
                </h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Direct engineering support for slicing orientation and infill advice.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="py-16 sm:py-20">
        <Container size="xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8">
            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 border border-white/10 text-[#FF6B35]">
                  <Layers className="size-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading text-lg font-black tracking-tight text-white leading-none">
                    PRINT<span className="text-[#FF6B35]">STUDIO</span>
                  </span>
                  <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">
                    Additive Manufacturing Lab
                  </span>
                </div>
              </Link>

              <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
                Next-generation 3D printing studio based in Cairo, Egypt. From rapid engineering prototypes to customized on-demand production batches.
              </p>

              <div className="pt-2 space-y-2 text-xs text-gray-400">
                <p className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-[#FF6B35]" />
                  <span>Cairo, Egypt · Industrial District</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="size-3.5 text-[#FF6B35]" />
                  <span>support@printstudio3d.com</span>
                </p>
              </div>
            </div>

            {/* Shop Navigation */}
            <div className="space-y-3">
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-white">
                Catalog & Store
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/products" className="hover:text-white transition-colors">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=mechanical" className="hover:text-white transition-colors">
                    Gears & Mechanical
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=desk-organization" className="hover:text-white transition-colors">
                    Studio Desk Gear
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=drone-rc" className="hover:text-white transition-colors">
                    Drones & RC Spares
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=cosplay" className="hover:text-white transition-colors">
                    Cosplay & Replicas
                  </Link>
                </li>
              </ul>
            </div>

            {/* Custom Manufacturing */}
            <div className="space-y-3">
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-white">
                Custom Printing
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/custom-prints" className="hover:text-white transition-colors text-[#FF6B35]">
                    Request a Quote
                  </Link>
                </li>
                <li>
                  <Link href="/materials" className="hover:text-white transition-colors">
                    Filament Properties
                  </Link>
                </li>
                <li>
                  <Link href="/custom-prints/guidelines" className="hover:text-white transition-colors">
                    STL & 3MF Guidelines
                  </Link>
                </li>
                <li>
                  <Link href="/custom-prints/slicing" className="hover:text-white transition-colors">
                    Infill & Shell Options
                  </Link>
                </li>
                <li>
                  <Link href="/custom-prints/bulk" className="hover:text-white transition-colors">
                    Batch Manufacturing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Orders & Help */}
            <div className="space-y-3">
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-white">
                Orders & Help
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/orders" className="hover:text-white transition-colors">
                    Track Your Order
                  </Link>
                </li>
                <li>
                  <Link href="/payments/guide" className="hover:text-white transition-colors">
                    InstaPay & Vodafone Cash
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="hover:text-white transition-colors">
                    Shipping & Delivery
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white transition-colors">
                    Frequently Asked Questions
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms & Quality Guarantee
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter Column */}
            <div className="space-y-3">
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-white">
                Studio Dispatch
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Receive alerts on limited engineering material drops, test models, and maker discounts.
              </p>

              {subscribed ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400">
                  <Check className="size-4 shrink-0" />
                  <span>Subscribed to Studio Dispatch!</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-2">
                  <Input
                    type="email"
                    placeholder="engineer@studio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-xs py-2"
                  />
                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    className="w-full text-xs justify-center"
                    iconRight={<ArrowRight className="size-3" />}
                  >
                    Subscribe
                  </Button>
                </form>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* Bottom Sub-Footer Bar */}
      <div className="border-t border-white/10 py-6 bg-[#0B0D11] text-xs text-gray-400">
        <Container size="xl" className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-mono">
              © {new Date().getFullYear()} PRINT STUDIO 3D. All rights reserved.
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Print Farm Telemetry: 100% Operational
            </span>
          </div>

          {/* Payment Method Badges */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 mr-1">Accepted:</span>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-mono border border-white/10">
              Cash on Delivery
            </span>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-mono border border-white/10 text-pink-400">
              InstaPay
            </span>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-mono border border-white/10 text-red-400">
              Vodafone Cash
            </span>
          </div>
        </Container>
      </div>
    </footer>
  );
}

