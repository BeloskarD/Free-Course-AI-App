export default function AppContainer({ children }) {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-7xl px-6 md:px-10">
        {children}
      </div>
    </div>
  );
}
