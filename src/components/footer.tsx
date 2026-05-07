export function Footer() {
  return (
    <footer className="border-t bg-[#1e293b] text-slate-400">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-center px-4 text-sm">
        &copy; {new Date().getFullYear()} TestPrep. All rights reserved.
      </div>
    </footer>
  );
}
