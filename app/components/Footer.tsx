import Link from "next/link";

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-white/5 bg-zinc-950 py-8 relative z-10 text-center">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-400">
            AI Knowledge Base Assistant
          </span>
          <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
        </div>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-zinc-300">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-zinc-300">
            Terms of Service
          </Link>
          <Link href="#" className="hover:text-zinc-300">
            System Status
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
