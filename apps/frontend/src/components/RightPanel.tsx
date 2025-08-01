export default function RightPanel({ children, styles = "" }: { children: React.ReactNode; styles?: string }) {
  return (
    <div
      className={`w-full lg:w-3/4 bg-white rounded-lg flex flex-col gap-4 py-8 px-6 h-full overflow-hidden ${styles}`}
    >
      {children}
    </div>
  );
}
