"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

function HamburgerSVG() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

function CloseButtonSVG() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-white py-2 text-blue-900 shadow-md"
          : "bg-transparent py-4 text-white"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold">CS UIL 2025-2026</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-8 md:flex">
            <Link
              href="/events"
              className="transition-colors hover:text-yellow-400"
            >
              Events
            </Link>
            <Link
              href="/resources"
              className="transition-colors hover:text-yellow-400"
            >
              Resources
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="focus:outline-none md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <CloseButtonSVG /> : <HamburgerSVG />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div
            className={`motion-opacity-in-0 motion-duration-300 motion-translate-y-in-25 motion-blur-in-md mt-4 rounded-lg py-4 md:hidden ${
              isScrolled ? "bg-white text-blue-900" : "bg-blue-900 text-white"
            }`}
          >
            <div className="flex flex-col space-y-3 px-4">
              <Link
                href="/about"
                className="py-2 transition-colors hover:text-yellow-400"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/events"
                className="py-2 transition-colors hover:text-yellow-400"
                onClick={() => setIsMenuOpen(false)}
              >
                Events
              </Link>
              <Link
                href="/resources"
                className="py-2 transition-colors hover:text-yellow-400"
                onClick={() => setIsMenuOpen(false)}
              >
                Resources
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
